import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

let bundleCache: string | null = null;

async function getBundle(): Promise<string> {
  if (!bundleCache) {
    bundleCache = await bundle({
      entryPoint: path.resolve(process.cwd(), "src/remotion/index.ts"),
    });
  }
  return bundleCache;
}

export async function POST(request: Request) {
  try {
    const { compositionId, inputProps, durationInFrames, fps = 30, width, height } =
      await request.json();

    if (!compositionId || !inputProps) {
      return NextResponse.json({ error: "Missing compositionId or inputProps" }, { status: 400 });
    }

    const serveUrl = await getBundle();

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    });

    const outFile = path.join(os.tmpdir(), `render-${Date.now()}.mp4`);

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: durationInFrames ?? composition.durationInFrames,
        fps,
        width: width ?? composition.width,
        height: height ?? composition.height,
      },
      serveUrl,
      codec: "h264",
      outputLocation: outFile,
      inputProps,
      imageFormat: "jpeg",
      jpegQuality: 100,
      crf: 8,
      pixelFormat: "yuv420p",
    });

    const buffer = await fs.readFile(outFile);
    await fs.unlink(outFile).catch(() => {});

    const filename = `${compositionId.toLowerCase()}-${Date.now()}.mp4`;
    return new Response(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    console.error("Render error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}
