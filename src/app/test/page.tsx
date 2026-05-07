"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DiagramType, VideoScript } from "../../types";

// All Remotion imports must be dynamic with ssr: false
const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false }
);

const DiagramPreviewComp = dynamic(
  () => import("../../remotion/DiagramPreview").then((m) => m.DiagramPreview),
  { ssr: false }
);

const NetworkingShortComp = dynamic(
  () => import("../../remotion/NetworkingShort").then((m) => m.NetworkingShort),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const NETWORKING_CONFIGS = [
  {
    type: "handshake" as DiagramType,
    name: "TCP Handshake",
    description: "3-way connection setup · SYN → SYN-ACK → ACK",
    testCases: [
      { label: "Full", keyTerms: [] as string[] },
      { label: "SYN", keyTerms: ["SYN"] },
      { label: "SYN-ACK", keyTerms: ["SYN-ACK"] },
      { label: "ACK", keyTerms: ["ACK"] },
    ],
  },
  {
    type: "dns" as DiagramType,
    name: "DNS Resolution",
    description: "Domain name → IP address lookup chain",
    testCases: [{ label: "Default", keyTerms: [] as string[] }],
  },
  {
    type: "packet" as DiagramType,
    name: "Packet Anatomy",
    description: "IP header · TCP header · Data payload",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "IP Header", keyTerms: ["ip"] },
      { label: "TCP Header", keyTerms: ["tcp"] },
      { label: "Data", keyTerms: ["data"] },
    ],
  },
  {
    type: "routing" as DiagramType,
    name: "Packet Routing",
    description: "Hop-by-hop delivery across routers",
    testCases: [{ label: "Default", keyTerms: [] as string[] }],
  },
  {
    type: "osi" as DiagramType,
    name: "OSI Model",
    description: "7 networking layers visualised",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "Transport", keyTerms: ["TRANSPORT", "TCP"] },
      { label: "Application", keyTerms: ["APPLICATION", "HTTP"] },
      { label: "Physical", keyTerms: ["PHYSICAL"] },
    ],
  },
  {
    type: "http" as DiagramType,
    name: "HTTP vs HTTPS",
    description: "Plaintext vs encrypted connections",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "HTTPS", keyTerms: ["HTTPS"] },
      { label: "TLS", keyTerms: ["TLS"] },
    ],
  },
  {
    type: "firewall" as DiagramType,
    name: "Firewall",
    description: "Traffic filtering — allow vs block",
    testCases: [{ label: "Default", keyTerms: [] as string[] }],
  },
  {
    type: "switch" as DiagramType,
    name: "Layer 2 Switching",
    description: "MAC table · unicast forwarding · star topology",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "MAC", keyTerms: ["MAC"] },
      { label: "SWITCH", keyTerms: ["SWITCH"] },
    ],
  },
  {
    type: "nat" as DiagramType,
    name: "NAT",
    description: "Network Address Translation · private → public IP",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "NAT", keyTerms: ["NAT"] },
      { label: "PORT", keyTerms: ["PORT"] },
    ],
  },
  {
    type: "dhcp" as DiagramType,
    name: "DHCP DORA",
    description: "Discover → Offer → Request → ACK",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "DISCOVER", keyTerms: ["DISCOVER"] },
      { label: "ACK", keyTerms: ["ACK"] },
    ],
  },
  {
    type: "arp" as DiagramType,
    name: "ARP Broadcast",
    description: "Who has this IP? · broadcast → unicast reply",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ARP", keyTerms: ["ARP"] },
      { label: "BROADCAST", keyTerms: ["BROADCAST"] },
    ],
  },
  {
    type: "vpn" as DiagramType,
    name: "VPN Tunnel",
    description: "Encrypted tunnel · client → VPN server → internet",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "VPN", keyTerms: ["VPN"] },
      { label: "TUNNEL", keyTerms: ["TUNNEL"] },
    ],
  },
  {
    type: "pubkey" as DiagramType,
    name: "Public/Private Key",
    description: "Asymmetric encryption · Alice & Bob",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PUBLIC KEY", keyTerms: ["PUBLIC KEY"] },
      { label: "PRIVATE KEY", keyTerms: ["PRIVATE KEY"] },
    ],
  },
  {
    type: "tls" as DiagramType,
    name: "TLS Handshake",
    description: "5-step TLS setup · certificates · session keys",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CERTIFICATE", keyTerms: ["CERTIFICATE"] },
      { label: "TLS", keyTerms: ["TLS"] },
    ],
  },
  {
    type: "proxy" as DiagramType,
    name: "Forward Proxy",
    description: "Client anonymity · IP masking · content filtering",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PROXY", keyTerms: ["PROXY"] },
      { label: "ANONYMOUS", keyTerms: ["ANONYMOUS"] },
    ],
  },
  {
    type: "revproxy" as DiagramType,
    name: "Reverse Proxy / LB",
    description: "Round-robin · single entry · backend distribution",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "LOAD BALANCER", keyTerms: ["LOAD BALANCER"] },
      { label: "REVERSE PROXY", keyTerms: ["REVERSE PROXY"] },
    ],
  },
  {
    type: "cdn" as DiagramType,
    name: "CDN",
    description: "Edge nodes · cache hit · low latency delivery",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CDN", keyTerms: ["CDN"] },
      { label: "CACHE", keyTerms: ["CACHE"] },
    ],
  },
  {
    type: "subnet" as DiagramType,
    name: "IP Subnetting",
    description: "Binary · /24 CIDR · network vs host bits",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SUBNET", keyTerms: ["SUBNET"] },
      { label: "HOST", keyTerms: ["HOST"] },
      { label: "CIDR", keyTerms: ["CIDR"] },
    ],
  },
  {
    type: "bgp" as DiagramType,
    name: "BGP / Autonomous Systems",
    description: "Inter-AS routing · route announcements · peering",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "BGP", keyTerms: ["BGP"] },
      { label: "AS", keyTerms: ["AS"] },
      { label: "ROUTE", keyTerms: ["ROUTE"] },
    ],
  },
];

// NEW: Foundations
const ML_FOUNDATIONS_CONFIGS = [
  {
    type: "mltypes" as DiagramType,
    name: "Types of Machine Learning",
    description: "Supervised · Unsupervised · Reinforcement — three paradigms",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SUPERVISED", keyTerms: ["SUPERVISED"] },
      { label: "UNSUPERVISED", keyTerms: ["UNSUPERVISED"] },
      { label: "REINFORCEMENT", keyTerms: ["REINFORCEMENT"] },
    ],
  },
  {
    type: "traintest" as DiagramType,
    name: "Train/Test/Val Split",
    description: "70/15/15 split · no data leakage · one-way flow",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "TRAIN", keyTerms: ["TRAIN"] },
      { label: "VAL", keyTerms: ["VAL"] },
      { label: "TEST", keyTerms: ["TEST"] },
    ],
  },
  {
    type: "crossval" as DiagramType,
    name: "K-Fold Cross-Validation",
    description: "5 folds · rotating validation segment · average score",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "K-FOLD", keyTerms: ["K-FOLD"] },
      { label: "VALIDATION", keyTerms: ["VALIDATION"] },
    ],
  },
  {
    type: "biasvar" as DiagramType,
    name: "Bias-Variance Tradeoff",
    description: "Dartboards · Bias² / Variance / Total Error curves · sweet spot",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "BIAS", keyTerms: ["BIAS"] },
      { label: "VARIANCE", keyTerms: ["VARIANCE"] },
      { label: "TRADEOFF", keyTerms: ["TRADEOFF"] },
    ],
  },
];

// NEW: Neural Network Basics
const ML_NN_BASICS_CONFIGS = [
  {
    type: "perceptron" as DiagramType,
    name: "Perceptron / Single Neuron",
    description: "Inputs · weights · bias · sum · activation · output",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "WEIGHT", keyTerms: ["WEIGHT"] },
      { label: "BIAS", keyTerms: ["BIAS"] },
      { label: "ACTIVATION", keyTerms: ["ACTIVATION"] },
    ],
  },
  {
    type: "activations" as DiagramType,
    name: "Activation Functions",
    description: "ReLU · Sigmoid · Tanh · Softmax — 2×2 grid of curves",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "RELU", keyTerms: ["RELU"] },
      { label: "SIGMOID", keyTerms: ["SIGMOID"] },
      { label: "TANH", keyTerms: ["TANH"] },
      { label: "SOFTMAX", keyTerms: ["SOFTMAX"] },
    ],
  },
  {
    type: "dropout" as DiagramType,
    name: "Dropout Regularization",
    description: "50% dropout · X-marked neurons · forward pass comparison",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "DROPOUT", keyTerms: ["DROPOUT"] },
      { label: "REGULARIZATION", keyTerms: ["REGULARIZATION"] },
    ],
  },
  {
    type: "batchnorm" as DiagramType,
    name: "Batch Normalization",
    description: "Skewed → normalized histogram · (x−μ)/σ · faster training",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "NORMALIZATION", keyTerms: ["NORMALIZATION"] },
      { label: "MEAN", keyTerms: ["MEAN"] },
      { label: "VARIANCE", keyTerms: ["VARIANCE"] },
    ],
  },
];

// NEW: Optimization (was Loss Functions, now extended)
const ML_OPTIMIZATION_CONFIGS = [
  {
    type: "optimizers" as DiagramType,
    name: "Optimizers: SGD vs Momentum vs Adam",
    description: "Loss contours · three optimizer trajectories to minimum",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SGD", keyTerms: ["SGD"] },
      { label: "MOMENTUM", keyTerms: ["MOMENTUM"] },
      { label: "ADAM", keyTerms: ["ADAM"] },
    ],
  },
];

// NEW: Deep Learning
const ML_DEEP_CONFIGS = [
  {
    type: "transformer" as DiagramType,
    name: "Transformer Block",
    description: "Embeddings → Positional Enc → Multi-Head Attn → FFN → Output",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ATTENTION", keyTerms: ["ATTENTION"] },
      { label: "FEEDFORWARD", keyTerms: ["FEEDFORWARD"] },
      { label: "RESIDUAL", keyTerms: ["RESIDUAL"] },
    ],
  },
];

// NEW: Reinforcement Learning
const ML_RL_CONFIGS = [
  {
    type: "rl" as DiagramType,
    name: "Reinforcement Learning Loop",
    description: "Agent → Action → Environment → State + Reward → feedback loop",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "AGENT", keyTerms: ["AGENT"] },
      { label: "ENVIRONMENT", keyTerms: ["ENVIRONMENT"] },
      { label: "REWARD", keyTerms: ["REWARD"] },
    ],
  },
];

// Existing ML diagrams (neural nets, deep learning, etc.)
const ML_CORE_CONFIGS = [
  {
    type: "nn" as DiagramType,
    name: "Neural Network",
    description: "Forward pass · 4-layer network · input → hidden → output",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "NEURON", keyTerms: ["NEURON"] },
      { label: "LAYER", keyTerms: ["LAYER"] },
      { label: "ACTIVATION", keyTerms: ["ACTIVATION"] },
    ],
  },
  {
    type: "backprop" as DiagramType,
    name: "Backpropagation",
    description: "Gradient flow right→left · loss signal · weight updates",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "GRADIENT", keyTerms: ["GRADIENT"] },
      { label: "LOSS", keyTerms: ["LOSS"] },
      { label: "BACKPROP", keyTerms: ["BACKPROP"] },
    ],
  },
  {
    type: "gradient" as DiagramType,
    name: "Gradient Descent",
    description: "Loss curve · ball rolls to minimum · convergence",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "GRADIENT", keyTerms: ["GRADIENT"] },
      { label: "LEARNING RATE", keyTerms: ["LEARNING RATE"] },
      { label: "MINIMUM", keyTerms: ["MINIMUM"] },
    ],
  },
  {
    type: "cnn" as DiagramType,
    name: "Convolutional Neural Net",
    description: "Input → Conv → Pool → Flatten → Output pipeline",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CONV", keyTerms: ["CONV"] },
      { label: "FILTER", keyTerms: ["FILTER"] },
      { label: "POOLING", keyTerms: ["POOLING"] },
    ],
  },
  {
    type: "attention" as DiagramType,
    name: "Self-Attention",
    description: "Q/K/V · attention scores · transformer mechanism",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ATTENTION", keyTerms: ["ATTENTION"] },
      { label: "QUERY", keyTerms: ["QUERY"] },
      { label: "KEY", keyTerms: ["KEY"] },
      { label: "VALUE", keyTerms: ["VALUE"] },
    ],
  },
  {
    type: "overfit" as DiagramType,
    name: "Overfitting",
    description: "Train vs val loss · sweet spot · overfit zone",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "OVERFIT", keyTerms: ["OVERFIT"] },
      { label: "VALIDATION", keyTerms: ["VALIDATION"] },
      { label: "GENERALIZATION", keyTerms: ["GENERALIZATION"] },
    ],
  },
  {
    type: "gan" as DiagramType,
    name: "GAN",
    description: "Generator vs Discriminator · adversarial training",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "GENERATOR", keyTerms: ["GENERATOR"] },
      { label: "DISCRIMINATOR", keyTerms: ["DISCRIMINATOR"] },
      { label: "ADVERSARIAL", keyTerms: ["ADVERSARIAL"] },
    ],
  },
  {
    type: "rnn" as DiagramType,
    name: "RNN",
    description: "Sequential processing · hidden state · recurrent cells",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "HIDDEN STATE", keyTerms: ["HIDDEN STATE"] },
      { label: "SEQUENCE", keyTerms: ["SEQUENCE"] },
      { label: "RECURRENT", keyTerms: ["RECURRENT"] },
    ],
  },
  {
    type: "embedding" as DiagramType,
    name: "Word Embeddings",
    description: "Vector space · King−Man+Woman≈Queen · analogies",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "EMBEDDING", keyTerms: ["EMBEDDING"] },
      { label: "VECTOR", keyTerms: ["VECTOR"] },
      { label: "ANALOGY", keyTerms: ["ANALOGY"] },
    ],
  },
  {
    type: "regularization" as DiagramType,
    name: "Regularization",
    description: "L2 reg · overfit vs smooth curve · lambda penalty",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "REGULARIZATION", keyTerms: ["REGULARIZATION"] },
      { label: "OVERFIT", keyTerms: ["OVERFIT"] },
      { label: "LAMBDA", keyTerms: ["LAMBDA"] },
    ],
  },
];

// Supervised Learning diagrams
const ML_SUPERVISED_CONFIGS = [
  {
    type: "linreg" as DiagramType,
    name: "Linear Regression",
    description: "Scatter points · best-fit line · residuals · equation",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "RESIDUAL", keyTerms: ["RESIDUAL"] },
      { label: "SLOPE", keyTerms: ["SLOPE"] },
      { label: "INTERCEPT", keyTerms: ["INTERCEPT"] },
    ],
  },
  {
    type: "polyreg" as DiagramType,
    name: "Polynomial Regression",
    description: "Quadratic trend · linear underfit vs poly fit",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "DEGREE", keyTerms: ["DEGREE"] },
      { label: "UNDERFIT", keyTerms: ["UNDERFIT"] },
      { label: "POLYNOMIAL", keyTerms: ["POLYNOMIAL"] },
    ],
  },
  {
    type: "logreg" as DiagramType,
    name: "Logistic Regression",
    description: "Sigmoid curve · decision boundary at p=0.5 · binary classes",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SIGMOID", keyTerms: ["SIGMOID"] },
      { label: "THRESHOLD", keyTerms: ["THRESHOLD"] },
      { label: "PROBABILITY", keyTerms: ["PROBABILITY"] },
    ],
  },
  {
    type: "svm" as DiagramType,
    name: "Support Vector Machine",
    description: "Hyperplane · margin lines · support vectors circled",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "MARGIN", keyTerms: ["MARGIN"] },
      { label: "SUPPORT VECTOR", keyTerms: ["SUPPORT VECTOR"] },
      { label: "HYPERPLANE", keyTerms: ["HYPERPLANE"] },
    ],
  },
  {
    type: "binaryclf" as DiagramType,
    name: "Binary Classification",
    description: "Two clusters · curved decision boundary · accuracy",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "BOUNDARY", keyTerms: ["BOUNDARY"] },
      { label: "ACCURACY", keyTerms: ["ACCURACY"] },
      { label: "MISCLASSIFIED", keyTerms: ["MISCLASSIFIED"] },
    ],
  },
  {
    type: "multiclf" as DiagramType,
    name: "Multi-class Classification",
    description: "Three clusters · decision regions · softmax probabilities",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SOFTMAX", keyTerms: ["SOFTMAX"] },
      { label: "CLASS", keyTerms: ["CLASS"] },
      { label: "BOUNDARY", keyTerms: ["BOUNDARY"] },
    ],
  },
  {
    type: "dtree" as DiagramType,
    name: "Decision Tree",
    description: "Binary splits · leaf nodes · sample traversal path",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SPLIT", keyTerms: ["SPLIT"] },
      { label: "LEAF", keyTerms: ["LEAF"] },
      { label: "FEATURE", keyTerms: ["FEATURE"] },
    ],
  },
  {
    type: "kmeans" as DiagramType,
    name: "K-Means Clustering",
    description: "3 clusters · centroid assignment · convergence",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CENTROID", keyTerms: ["CENTROID"] },
      { label: "CLUSTER", keyTerms: ["CLUSTER"] },
      { label: "K-MEANS", keyTerms: ["K-MEANS"] },
    ],
  },
  {
    type: "naivebayes" as DiagramType,
    name: "Naive Bayes",
    description: "Bayes theorem · spam classifier · prior → posterior",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PRIOR", keyTerms: ["PRIOR"] },
      { label: "POSTERIOR", keyTerms: ["POSTERIOR"] },
      { label: "LIKELIHOOD", keyTerms: ["LIKELIHOOD"] },
      { label: "BAYES", keyTerms: ["BAYES"] },
    ],
  },
  {
    type: "ensemble" as DiagramType,
    name: "Ensemble / Random Forest",
    description: "4 decision trees · majority vote · final prediction",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ENSEMBLE", keyTerms: ["ENSEMBLE"] },
      { label: "VOTE", keyTerms: ["VOTE"] },
      { label: "RANDOM FOREST", keyTerms: ["RANDOM FOREST"] },
      { label: "BAGGING", keyTerms: ["BAGGING"] },
    ],
  },
  {
    type: "knn" as DiagramType,
    name: "K-Nearest Neighbors",
    description: "K=5 circle · vote tally · class assignment",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "DISTANCE", keyTerms: ["DISTANCE"] },
      { label: "K=5", keyTerms: ["K=5"] },
      { label: "NEIGHBORS", keyTerms: ["NEIGHBORS"] },
    ],
  },
  {
    type: "randomforest" as DiagramType,
    name: "Random Forest",
    description: "4 trees · random feature subsets · majority vote",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "BAGGING", keyTerms: ["BAGGING"] },
      { label: "RANDOM FOREST", keyTerms: ["RANDOM FOREST"] },
      { label: "TREES", keyTerms: ["TREES"] },
    ],
  },
  {
    type: "boosting" as DiagramType,
    name: "Gradient Boosting",
    description: "Sequential trees · shrinking residuals · cumulative fit",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "BOOSTING", keyTerms: ["BOOSTING"] },
      { label: "RESIDUAL", keyTerms: ["RESIDUAL"] },
      { label: "WEAK LEARNER", keyTerms: ["WEAK LEARNER"] },
    ],
  },
  {
    type: "ridgelasso" as DiagramType,
    name: "Ridge vs Lasso",
    description: "L2 circle vs L1 diamond · sparse weights · optimal point",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "L2 / RIDGE", keyTerms: ["L2"] },
      { label: "L1 / LASSO", keyTerms: ["L1"] },
      { label: "SPARSE", keyTerms: ["SPARSE"] },
    ],
  },
];

// Loss Functions diagrams
const ML_LOSS_CONFIGS = [
  {
    type: "mseloss" as DiagramType,
    name: "MSE Loss",
    description: "Squared error boxes · regression line · MSE formula",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "MSE", keyTerms: ["MSE"] },
      { label: "SQUARED ERROR", keyTerms: ["SQUARED ERROR"] },
      { label: "LOSS", keyTerms: ["LOSS"] },
    ],
  },
  {
    type: "crossentropy" as DiagramType,
    name: "Cross-Entropy Loss",
    description: "–log(p) curves · confidence vs penalty · CE formula",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ENTROPY", keyTerms: ["ENTROPY"] },
      { label: "CONFIDENCE", keyTerms: ["CONFIDENCE"] },
      { label: "PENALTY", keyTerms: ["PENALTY"] },
    ],
  },
  {
    type: "hingeloss" as DiagramType,
    name: "Hinge Loss (SVM)",
    description: "max(0, 1–y·f(x)) · kink at margin · penalized zone",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "HINGE", keyTerms: ["HINGE"] },
      { label: "MARGIN", keyTerms: ["MARGIN"] },
      { label: "SVM", keyTerms: ["SVM"] },
    ],
  },
];

// Unsupervised & Evaluation diagrams
const ML_UNSUPERVISED_EVAL_CONFIGS = [
  {
    type: "pca" as DiagramType,
    name: "PCA",
    description: "Principal components · 2D→1D projection · variance retained",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PCA", keyTerms: ["PCA"] },
      { label: "VARIANCE", keyTerms: ["VARIANCE"] },
      { label: "PROJECTION", keyTerms: ["PROJECTION"] },
      { label: "DIMENSION", keyTerms: ["DIMENSION"] },
    ],
  },
  {
    type: "dbscan" as DiagramType,
    name: "DBSCAN",
    description: "Density-based clusters · epsilon radius · noise points",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "EPSILON", keyTerms: ["EPSILON"] },
      { label: "NOISE", keyTerms: ["NOISE"] },
      { label: "DENSITY", keyTerms: ["DENSITY"] },
      { label: "DBSCAN", keyTerms: ["DBSCAN"] },
    ],
  },
  {
    type: "autoencoder" as DiagramType,
    name: "Autoencoder",
    description: "Hourglass network · latent space · reconstruction loss",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "LATENT", keyTerms: ["LATENT"] },
      { label: "ENCODER", keyTerms: ["ENCODER"] },
      { label: "DECODER", keyTerms: ["DECODER"] },
      { label: "COMPRESS", keyTerms: ["COMPRESS"] },
    ],
  },
  {
    type: "confusion" as DiagramType,
    name: "Confusion Matrix",
    description: "TP/FP/FN/TN · precision & recall · F1 score",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PRECISION", keyTerms: ["PRECISION"] },
      { label: "RECALL", keyTerms: ["RECALL"] },
      { label: "F1", keyTerms: ["F1"] },
      { label: "FALSE POSITIVE", keyTerms: ["FALSE POSITIVE"] },
    ],
  },
  {
    type: "roc" as DiagramType,
    name: "ROC Curve",
    description: "FPR vs TPR · AUC = 0.91 · threshold point",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "AUC", keyTerms: ["AUC"] },
      { label: "ROC", keyTerms: ["ROC"] },
      { label: "THRESHOLD", keyTerms: ["THRESHOLD"] },
      { label: "TPR", keyTerms: ["TPR"] },
      { label: "FPR", keyTerms: ["FPR"] },
    ],
  },
  {
    type: "dendrogram" as DiagramType,
    name: "Hierarchical Clustering / Dendrogram",
    description: "8 leaves · bottom-up merges · cut line → 3 clusters",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "MERGE", keyTerms: ["MERGE"] },
      { label: "DENDROGRAM", keyTerms: ["DENDROGRAM"] },
      { label: "CUT", keyTerms: ["CUT"] },
    ],
  },
];


// ---------------------------------------------------------------------------
// Agentic AI diagram configs
// ---------------------------------------------------------------------------

const AGENT_FOUNDATIONS_CONFIGS = [
  {
    type: "agent" as DiagramType,
    name: "Anatomy of an Agent",
    description: "LLM brain + Tools + Memory + Planning — four pillars of an agent",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "LLM", keyTerms: ["LLM"] },
      { label: "PLANNING", keyTerms: ["PLANNING"] },
      { label: "TOOLS", keyTerms: ["TOOLS"] },
      { label: "MEMORY", keyTerms: ["MEMORY"] },
    ],
  },
  {
    type: "workflowvsagent" as DiagramType,
    name: "Workflow vs Agent",
    description: "Deterministic pipeline vs adaptive decision-making",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "WORKFLOW", keyTerms: ["WORKFLOW"] },
      { label: "AGENT", keyTerms: ["AGENT"] },
    ],
  },
  {
    type: "react" as DiagramType,
    name: "ReAct Loop",
    description: "Thought → Action → Observation → repeat until solved",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "THOUGHT", keyTerms: ["THOUGHT"] },
      { label: "ACTION", keyTerms: ["ACTION"] },
      { label: "OBSERVATION", keyTerms: ["OBSERVATION"] },
    ],
  },
];

const AGENT_TOOLUSE_CONFIGS = [
  {
    type: "toolcall" as DiagramType,
    name: "Tool Calling Flow",
    description: "User → LLM → JSON tool call → Tool executes → Result → Answer",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "FUNCTION CALL", keyTerms: ["FUNCTION CALL"] },
      { label: "JSON", keyTerms: ["JSON"] },
    ],
  },
  {
    type: "paralleltools" as DiagramType,
    name: "Parallel Tool Calls",
    description: "LLM fans out 4 tool calls simultaneously — 4x faster",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PARALLEL", keyTerms: ["PARALLEL"] },
    ],
  },
  {
    type: "toolschema" as DiagramType,
    name: "Tool Schema / Function Definition",
    description: "JSON schema definition → LLM reads → produces valid call → validation",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SCHEMA", keyTerms: ["SCHEMA"] },
      { label: "PARAMETERS", keyTerms: ["PARAMETERS"] },
    ],
  },
];

const AGENT_MEMORY_CONFIGS = [
  {
    type: "rag" as DiagramType,
    name: "Retrieval-Augmented Generation",
    description: "Query → Embed → Vector DB → Top-K chunks → LLM → Answer",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "RETRIEVAL", keyTerms: ["RETRIEVAL"] },
      { label: "EMBED", keyTerms: ["EMBED"] },
      { label: "AUGMENTED", keyTerms: ["AUGMENTED"] },
    ],
  },
  {
    type: "vectordb" as DiagramType,
    name: "Vector Database Search",
    description: "Chunks → embeddings → 2D space → cosine similarity → top-3 results",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "EMBEDDING", keyTerms: ["EMBEDDING"] },
      { label: "COSINE SIMILARITY", keyTerms: ["COSINE SIMILARITY"] },
      { label: "K-NN", keyTerms: ["K-NN"] },
    ],
  },
  {
    type: "memoryhier" as DiagramType,
    name: "Memory Hierarchy",
    description: "Short-term context window · working session memory · long-term vector DB",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SHORT-TERM", keyTerms: ["SHORT-TERM"] },
      { label: "LONG-TERM", keyTerms: ["LONG-TERM"] },
      { label: "RECALL", keyTerms: ["RECALL"] },
    ],
  },
  {
    type: "contextwindow" as DiagramType,
    name: "Context Window Management",
    description: "Token bar · system + history + RAG + message · truncate / summarize",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CONTEXT", keyTerms: ["CONTEXT"] },
      { label: "TOKEN", keyTerms: ["TOKEN"] },
      { label: "TRUNCATE", keyTerms: ["TRUNCATE"] },
      { label: "SUMMARIZE", keyTerms: ["SUMMARIZE"] },
    ],
  },
];

const AGENT_REASONING_CONFIGS = [
  {
    type: "cot" as DiagramType,
    name: "Chain of Thought",
    description: "Step-by-step reasoning: 17×23 broken into sub-problems → 391",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "REASONING", keyTerms: ["REASONING"] },
      { label: "STEP BY STEP", keyTerms: ["STEP BY STEP"] },
    ],
  },
  {
    type: "tot" as DiagramType,
    name: "Tree of Thoughts",
    description: "Branch reasoning paths · evaluate · prune dead ends · best path",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "TREE", keyTerms: ["TREE"] },
      { label: "BACKTRACK", keyTerms: ["BACKTRACK"] },
      { label: "EVALUATE", keyTerms: ["EVALUATE"] },
    ],
  },
  {
    type: "reflection" as DiagramType,
    name: "Self-Reflection",
    description: "Generate → Critique → Revise · 3 iterations · quality meter 40→95%",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "CRITIQUE", keyTerms: ["CRITIQUE"] },
      { label: "REVISE", keyTerms: ["REVISE"] },
      { label: "ITERATION", keyTerms: ["ITERATION"] },
    ],
  },
];

const AGENT_ARCH_CONFIGS = [
  {
    type: "multiagent" as DiagramType,
    name: "Multi-Agent System",
    description: "Researcher · Writer · Reviewer · Editor sharing a message bus",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "COLLABORATION", keyTerms: ["COLLABORATION"] },
      { label: "RESEARCHER", keyTerms: ["RESEARCHER"] },
      { label: "WRITER", keyTerms: ["WRITER"] },
    ],
  },
  {
    type: "hierarchical" as DiagramType,
    name: "Hierarchical / Supervisor-Worker",
    description: "Supervisor decomposes task → 3 workers execute → aggregate results",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "SUPERVISOR", keyTerms: ["SUPERVISOR"] },
      { label: "DELEGATE", keyTerms: ["DELEGATE"] },
      { label: "AGGREGATE", keyTerms: ["AGGREGATE"] },
    ],
  },
  {
    type: "handoff" as DiagramType,
    name: "Agent Handoff / Routing",
    description: "Triage agent classifies intent → routes to Sales / Support / Tech",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ROUTING", keyTerms: ["ROUTING"] },
      { label: "TRIAGE", keyTerms: ["TRIAGE"] },
      { label: "HANDOFF", keyTerms: ["HANDOFF"] },
    ],
  },
  {
    type: "orchestrator" as DiagramType,
    name: "Orchestrator-Worker Pattern",
    description: "Central orchestrator dynamically plans · dispatches workers · synthesizes",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "ORCHESTRATOR", keyTerms: ["ORCHESTRATOR"] },
      { label: "DECOMPOSE", keyTerms: ["DECOMPOSE"] },
      { label: "DYNAMIC", keyTerms: ["DYNAMIC"] },
    ],
  },
];

const AGENT_SAFETY_CONFIGS = [
  {
    type: "guardrails" as DiagramType,
    name: "Guardrails / Prompt Injection Defense",
    description: "Input shield · output shield · block prompt injection · filter PII",
    testCases: [
      { label: "Default", keyTerms: [] as string[] },
      { label: "PROMPT INJECTION", keyTerms: ["PROMPT INJECTION"] },
      { label: "GUARDRAIL", keyTerms: ["GUARDRAIL"] },
      { label: "FILTER", keyTerms: ["FILTER"] },
    ],
  },
];

const DIAGRAM_COLORS: Record<string, string> = {
  // Networking
  handshake: "#00C8E6",
  dns:       "#7B5EF8",
  packet:    "#00D4A0",
  routing:   "#F5A623",
  osi:       "#7B5EF8",
  http:      "#00D4A0",
  firewall:  "#F5A623",
  switch:    "#00C8E6",
  nat:       "#7B5EF8",
  dhcp:      "#F5506B",
  arp:       "#F5A623",
  vpn:       "#00C8E6",
  pubkey:    "#F5A623",
  tls:       "#00D4A0",
  proxy:     "#7B5EF8",
  revproxy:  "#00C8E6",
  cdn:       "#00D4A0",
  subnet:    "#00C8E6",
  bgp:       "#F5A623",
  // Machine Learning
  nn:             "#7B5EF8",
  backprop:       "#F5506B",
  gradient:       "#7B5EF8",
  cnn:            "#00C8E6",
  attention:      "#7B5EF8",
  kmeans:         "#00C8E6",
  dtree:          "#00D4A0",
  overfit:        "#F5506B",
  gan:            "#7B5EF8",
  rnn:            "#7B5EF8",
  embedding:      "#F5A623",
  regularization: "#00D4A0",
  // Supervised Learning
  linreg:        "#00C8E6",
  polyreg:       "#00D4A0",
  logreg:        "#7B5EF8",
  svm:           "#F5A623",
  binaryclf:     "#00C8E6",
  multiclf:      "#7B5EF8",
  naivebayes:    "#F5A623",
  ensemble:      "#00D4A0",
  // Loss Functions
  mseloss:       "#F5506B",
  crossentropy:  "#F5506B",
  hingeloss:     "#F5A623",
  // Unsupervised & Evaluation
  pca:           "#00C8E6",
  dbscan:        "#7B5EF8",
  autoencoder:   "#7B5EF8",
  confusion:     "#00D4A0",
  roc:           "#7B5EF8",
  // Foundations
  mltypes:       "#00C8E6",
  traintest:     "#00D4A0",
  crossval:      "#7B5EF8",
  biasvar:       "#F5A623",
  // Supervised (new)
  knn:           "#00C8E6",
  randomforest:  "#00D4A0",
  boosting:      "#7B5EF8",
  ridgelasso:    "#F5A623",
  // Optimization
  optimizers:    "#F5506B",
  // NN Basics
  perceptron:    "#00C8E6",
  activations:   "#7B5EF8",
  dropout:       "#F5506B",
  batchnorm:     "#00D4A0",
  // Unsupervised
  dendrogram:    "#F5A623",
  // Deep Learning
  transformer:   "#7B5EF8",
  // Reinforcement Learning
  rl:            "#00D4A0",
  // Agentic AI — Foundations
  agent:          "#7B5EF8",
  workflowvsagent:"#00C8E6",
  react:          "#7B5EF8",
  // Agentic AI — Tool Use
  toolcall:       "#F5A623",
  paralleltools:  "#00C8E6",
  toolschema:     "#F5A623",
  // Agentic AI — Memory & Context
  rag:            "#7B5EF8",
  vectordb:       "#F5A623",
  memoryhier:     "#00D4A0",
  contextwindow:  "#00C8E6",
  // Agentic AI — Reasoning
  cot:            "#7B5EF8",
  tot:            "#00D4A0",
  reflection:     "#F5A623",
  // Agentic AI — Architectures
  multiagent:     "#00C8E6",
  hierarchical:   "#7B5EF8",
  handoff:        "#00C8E6",
  orchestrator:   "#7B5EF8",
  // Agentic AI — Safety
  guardrails:     "#00D4A0",
};

const SCENE_CONFIGS: { label: string; description: string; script: VideoScript }[] = [
  {
    label: "Intro",
    description: "Title card + ring animation",
    script: {
      title: "TCP HANDSHAKE",
      subtitle: "How two computers connect",
      concept: "tcp-handshake",
      scenes: [{ type: "intro", headline: "TCP HANDSHAKE", duration: 7 }],
    },
  },
  {
    label: "Concept — Handshake",
    description: "SYN-ACK highlighted",
    script: {
      title: "TCP HANDSHAKE",
      subtitle: "...",
      concept: "tcp",
      scenes: [
        {
          type: "concept",
          headline: "Step 2: SYN-ACK",
          subtext: "Server acknowledges and agrees to connect.",
          diagramType: "handshake",
          keyTerms: ["SYN-ACK"],
          duration: 8,
        },
      ],
    },
  },
  {
    label: "Concept — OSI",
    description: "Transport layer highlight",
    script: {
      title: "OSI MODEL",
      subtitle: "...",
      concept: "osi",
      scenes: [
        {
          type: "concept",
          headline: "7 Layers",
          subtext: "Each layer handles a specific part of communication.",
          diagramType: "osi",
          keyTerms: ["TRANSPORT"],
          duration: 10,
        },
      ],
    },
  },
  {
    label: "Concept — HTTP",
    description: "HTTPS vs HTTP comparison",
    script: {
      title: "HTTPS",
      subtitle: "...",
      concept: "https",
      scenes: [
        {
          type: "concept",
          headline: "HTTP vs HTTPS",
          subtext: "One encrypts your data. One doesn't.",
          diagramType: "http",
          keyTerms: ["HTTPS"],
          duration: 9,
        },
      ],
    },
  },
  {
    label: "Outro",
    description: "CTA + takeaway animation",
    script: {
      title: "TCP HANDSHAKE",
      subtitle: "...",
      concept: "tcp-handshake",
      scenes: [
        {
          type: "outro",
          headline: "3 packets. 1 connection.",
          subtext: "Every TCP connection starts with this exchange.",
          duration: 7,
        },
      ],
    },
  },
];

const DURATION_OPTIONS = [
  { label: "4s", value: 4 },
  { label: "8s", value: 8 },
  { label: "12s", value: 12 },
];

// ---------------------------------------------------------------------------
// DiagramCard
// ---------------------------------------------------------------------------

interface DiagramCardProps {
  type: DiagramType;
  name: string;
  description: string;
  testCases: { label: string; keyTerms: string[] }[];
  durationSecs: number;
}

function DiagramCard({ type, name, description, testCases, durationSecs }: DiagramCardProps) {
  const [selectedCase, setSelectedCase] = useState(0);
  const accent = DIAGRAM_COLORS[type] ?? "#00C8E6";
  const activeCase = testCases[selectedCase];
  const durationInFrames = durationSecs * 30;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-2)" }}>
          {description}
        </div>
      </div>

      {/* Player */}
      <div style={{
        border: "1px solid var(--border-md)",
        borderRadius: 10,
        overflow: "hidden",
        background: "#505050",
        aspectRatio: "1080/700",
        width: "100%",
      }}>
        <Player
          key={`${type}-${durationSecs}-${selectedCase}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={DiagramPreviewComp as any}
          inputProps={{ diagramType: type, keyTerms: activeCase.keyTerms }}
          durationInFrames={durationInFrames}
          compositionWidth={1080}
          compositionHeight={700}
          fps={30}
          style={{ width: "100%", aspectRatio: "1080/700" }}
          controls
          loop
          autoPlay
        />
      </div>

      {/* Test case pills */}
      {testCases.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {testCases.map((tc, i) => {
            const isActive = i === selectedCase;
            return (
              <button
                key={i}
                onClick={() => setSelectedCase(i)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  cursor: "pointer",
                  fontFamily: "var(--sans)",
                  border: isActive ? `1px solid ${accent}` : "1px solid var(--border)",
                  background: isActive ? `${accent}22` : "transparent",
                  color: isActive ? accent : "var(--text-2)",
                  transition: "all 0.15s",
                }}
              >
                {tc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SceneCard
// ---------------------------------------------------------------------------

interface SceneCardProps {
  label: string;
  description: string;
  script: VideoScript;
  accent?: string;
}

function SceneCard({ label, description, script }: SceneCardProps) {
  const totalFrames = script.scenes.reduce((a, s) => a + s.duration * 30, 0);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: 0.3 }}>
        {label}
      </div>

      {/* Player */}
      <div style={{
        border: "1px solid var(--border-md)",
        borderRadius: 10,
        overflow: "hidden",
        background: "#505050",
        width: 260,
        height: 462,
        flexShrink: 0,
      }}>
        <Player
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={NetworkingShortComp as any}
          inputProps={{ script }}
          durationInFrames={totalFrames}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={30}
          style={{ width: 260, height: 462 }}
          controls
          loop
          autoPlay
        />
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5, maxWidth: 260 }}>
        {description}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DurationToggle
// ---------------------------------------------------------------------------

interface DurationToggleProps {
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
}

function DurationToggle({ value, onChange, accentColor }: DurationToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: "var(--text-3)",
      }}>
        DURATION
      </span>
      {DURATION_OPTIONS.map(opt => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "4px 12px",
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--sans)",
              border: isActive ? `1px solid ${accentColor}` : "1px solid var(--border)",
              background: isActive ? `${accentColor}26` : "transparent",
              color: isActive ? accentColor : "var(--text-2)",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TestPage() {
  const [netDuration, setNetDuration] = useState(8);
  const [mlDuration, setMlDuration] = useState(8);
  const [agentDuration, setAgentDuration] = useState(8);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Left: back link */}
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "var(--text-2)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            letterSpacing: 0.2,
          }}
        >
          ← Home
        </Link>

        {/* Center: title */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: 0.3 }}>
            Code Cruise
          </span>
          <span style={{ fontSize: 13, color: "var(--text-3)", letterSpacing: 0.5 }}>
            / Test Lab
          </span>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 40px 80px" }}>

        {/* ---------------------------------------------------------------- */}
        {/* Section 1: Networking Diagrams                                   */}
        {/* ---------------------------------------------------------------- */}
        <section style={{ marginBottom: 72 }}>
          {/* Section header row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#00C8E6",
            }}>
              NETWORKING DIAGRAMS
            </div>
            <DurationToggle
              value={netDuration}
              onChange={setNetDuration}
              accentColor="#00C8E6"
            />
          </div>

          {/* 2-column grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {NETWORKING_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={netDuration}
              />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2: Machine Learning Diagrams                             */}
        {/* ---------------------------------------------------------------- */}
        <section style={{ marginBottom: 72 }}>
          {/* Section header row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#7B5EF8",
            }}>
              MACHINE LEARNING DIAGRAMS
            </div>
            <DurationToggle
              value={mlDuration}
              onChange={setMlDuration}
              accentColor="#7B5EF8"
            />
          </div>

          {/* ── FOUNDATIONS ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              FOUNDATIONS
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_FOUNDATIONS_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Core ML (neural nets, deep learning) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              CORE ML
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_CORE_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: Supervised Learning */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              SUPERVISED LEARNING
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_SUPERVISED_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: OPTIMIZATION (was Loss Functions) */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              OPTIMIZATION
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {[...ML_OPTIMIZATION_CONFIGS, ...ML_LOSS_CONFIGS].map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: Neural Network Basics */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              NEURAL NETWORK BASICS
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_NN_BASICS_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: Unsupervised & Evaluation */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              UNSUPERVISED & EVALUATION
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_UNSUPERVISED_EVAL_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: Deep Learning */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              DEEP LEARNING
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_DEEP_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>

          {/* Subsection divider: Reinforcement Learning */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              REINFORCEMENT LEARNING
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 40,
          }}>
            {ML_RL_CONFIGS.map(cfg => (
              <DiagramCard
                key={cfg.type}
                type={cfg.type}
                name={cfg.name}
                description={cfg.description}
                testCases={cfg.testCases}
                durationSecs={mlDuration}
              />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 3: Agentic AI Diagrams                                   */}
        {/* ---------------------------------------------------------------- */}
        <section style={{ marginBottom: 72 }}>
          {/* Section header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#F5A623",
            }}>
              AGENTIC AI DIAGRAMS
            </div>
            <DurationToggle
              value={agentDuration}
              onChange={setAgentDuration}
              accentColor="#F5A623"
            />
          </div>

          {/* ── FOUNDATIONS ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              FOUNDATIONS
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_FOUNDATIONS_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>

          {/* ── TOOL USE ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              TOOL USE
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_TOOLUSE_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>

          {/* ── MEMORY & CONTEXT ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              MEMORY &amp; CONTEXT
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_MEMORY_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>

          {/* ── REASONING ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              REASONING
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_REASONING_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>

          {/* ── ARCHITECTURES ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              ARCHITECTURES
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_ARCH_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>

          {/* ── SAFETY ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "52px 0 28px",
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
            }}>
              SAFETY
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 40 }}>
            {AGENT_SAFETY_CONFIGS.map(cfg => (
              <DiagramCard key={cfg.type} type={cfg.type} name={cfg.name}
                description={cfg.description} testCases={cfg.testCases} durationSecs={agentDuration} />
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Section 4: Scene Previews                                        */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: "var(--text-3)",
            marginBottom: 28,
          }}>
            SCENE PREVIEWS
          </div>

          {/* Horizontal scrollable row */}
          <div style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            paddingBottom: 16,
            scrollbarWidth: "thin",
          }}>
            {SCENE_CONFIGS.map(cfg => (
              <SceneCard
                key={cfg.label}
                label={cfg.label}
                description={cfg.description}
                script={cfg.script}
              />
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
