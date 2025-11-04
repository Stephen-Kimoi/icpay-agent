import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { PaymentState, Quote, PaymentResult, JobResult } from "@/types/payment";

// Mock API function for job execution
const mockExecuteJob = async (request: string): Promise<JobResult> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let output = "";
  if (request.toLowerCase().includes("math") || request.toLowerCase().includes("solve")) {
    output = "The answer is 42. (Note: This is a mock response. In a real implementation, the LLM canister would solve the problem.)";
  } else if (request.toLowerCase().includes("poem") || request.toLowerCase().includes("write")) {
    output = `In the realm of code and light,\nWhere automation takes its flight,\nICPAY powers the flow,\nMaking payments seamless, you know.\n\n(This is a mock poem. In production, the LLM canister generates real creative content.)`;
  } else {
    output = `Processing: "${request}"\n\nThis is a mock response. In a real implementation, the LLM canister would process your request and generate an appropriate output based on the task.`;
  }

  return { output };
};

export default function PaymentAgent() {
  const [userRequest, setUserRequest] = useState("");
  const [state, setState] = useState<PaymentState>("idle");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [jobResult, setJobResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Mock wallet state
  const principal = null;
  const isConnected = false;
  const hasWallet = false;
  const walletSelect = null;
  const isGettingQuote = false;
  const isPaymentPending = false;

  const connect = async () => {
    console.log("connect called");
  };

  const disconnect = async () => {
    console.log("disconnect called");
  };

  const getQuote = (request: string) => {
    console.log("getQuote called with:", request);
    // Mock quote
    setTimeout(() => {
      setQuote({
        price: 0.5,
        currency: "ICP",
        job_id: "job_1234567890",
      });
      setState("quoted");
      setError(null);
    }, 1000);
  };

  const createPayment = async (params: any) => {
    console.log("createPayment called with:", params);
    // Mock payment
    return {
      transactionId: "tx_mock_123",
      id: "tx_mock_123",
    };
  };

  const handleGetQuote = (): void => {
    if (!userRequest.trim()) {
      setError("Please enter a request");
      return;
    }
    setError(null);
    setState("idle");
    setQuote(null);
    setPaymentResult(null);
    setJobResult(null);
    getQuote(userRequest);
  };

  const handlePayNow = async (): Promise<void> => {
    if (!quote) return;

    setError(null);
    setState("waiting_for_payment");

    try {
      const publishableKey = "";

      console.log("Payment environment check:", {
        hasPublishableKey: !!publishableKey,
        hasWallet,
        isConnected,
        principal,
      });

      if (publishableKey && hasWallet && walletSelect && principal) {
        console.log("Initiating ICPay payment...");

        const owner = principal;
        const currency = quote.currency.toUpperCase();

        if (currency === "USD") {
          await createPayment({
            mode: "usd",
            usdAmount: quote.price,
            symbol: "ICP",
            metadata: { job_id: quote.job_id },
            actorProvider: (canisterId: string, idl: unknown) =>
              (walletSelect.getActor as (a: { canisterId: string; idl: unknown; requiresSigning: boolean; anon: boolean }) => unknown)({ canisterId, idl, requiresSigning: true, anon: false }),
            connectedWallet: { owner },
            enableEvents: true,
            debug: true,
          });
        } else {
          const e8s = Math.round(quote.price * 100_000_000);

          await createPayment({
            mode: "token",
            amount: String(e8s),
            symbol: currency,
            metadata: { job_id: quote.job_id },
            actorProvider: (canisterId: string, idl: unknown) =>
              (walletSelect.getActor as (a: { canisterId: string; idl: unknown; requiresSigning: boolean; anon: boolean }) => unknown)({ canisterId, idl, requiresSigning: true, anon: false }),
            connectedWallet: { owner },
            enableEvents: true,
            debug: true,
          });
        }

        console.log("ICPay payment completed, executing job...");
      } else {
        console.log("Using mock payment (no ICPay setup detected)");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const transactionId = `tx_mock_${Math.random().toString(36).substring(2, 15)}`;
        setPaymentResult({
          transactionId,
          success: true,
        });

        console.log("Mock payment completed, executing job...");
      }

      setState("executing");
      const result = await mockExecuteJob(userRequest);
      setJobResult(result);
      setState("completed");
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setState("error");
    }
  };

  const handleReset = (): void => {
    setUserRequest("");
    setState("idle");
    setQuote(null);
    setPaymentResult(null);
    setJobResult(null);
    setError(null);
  };

  const getStepStatus = (step: number): string => {
    if (state === "idle" || state === "error") {
      return step === 1 ? "active" : "pending";
    }
    if (state === "quoted") {
      return step === 1 ? "completed" : step === 2 ? "active" : "pending";
    }
    if (state === "waiting_for_payment") {
      return step <= 2 ? "completed" : step === 3 ? "active" : "pending";
    }
    if (state === "executing") {
      return step <= 3 ? "completed" : step === 4 ? "active" : "pending";
    }
    return "completed";
  };

  const isProcessing = isGettingQuote || isPaymentPending || state === "executing";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Autonomous Payment Agent
          </h1>
        </div>
        <p className="text-gray-400 text-lg">
          Powered by ICPay
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8">
        {/* Wallet Status and Actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            {isConnected ? (
              <span>
                Wallet connected: <span className="font-mono text-gray-200">{principal?.toString()}</span>
              </span>
            ) : (
              <span className="text-yellow-300">No wallet connected</span>
            )}
          </div>
          <div className="flex gap-2">
            {!isConnected ? (
              <Button
                onClick={() => { void connect(); }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Connect Wallet
              </Button>
            ) : (
              <Button
                onClick={() => { void disconnect(); }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[
              { label: "Quote", icon: Clock },
              { label: "Payment", icon: Loader2 },
              { label: "Settling", icon: Loader2 },
              { label: "Executing", icon: Sparkles },
              { label: "Done", icon: CheckCircle2 },
            ].map((step, index) => {
              const stepNum = index + 1;
              const status = getStepStatus(stepNum);
              const Icon = step.icon;
              const isLast = index === 4;

              return (
                <div key={stepNum} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        status === "completed"
                          ? "bg-green-500 text-white"
                          : status === "active"
                            ? "bg-purple-500 text-white animate-pulse"
                            : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        status === "completed"
                          ? "text-green-400"
                          : status === "active"
                            ? "text-purple-400"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                        status === "completed"
                          ? "bg-green-500"
                          : status === "active"
                            ? "bg-purple-500/50"
                            : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Enter your request
          </label>
          <textarea
            value={userRequest}
            onChange={(e) => { setUserRequest(e.target.value); }}
            placeholder="e.g., Solve the math problem: 15 * 23, or Write a short poem about automation"
            className="w-full min-h-[120px] px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
            disabled={isProcessing || (state !== "idle" && state !== "error" && state !== "quoted")}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading Quote */}
        {isGettingQuote && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-purple-300">Getting quote...</span>
          </div>
        )}

        {/* Quote Display */}
        {quote && state !== "completed" && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Quoted Price</p>
                <p className="text-2xl font-bold text-purple-400">
                  {quote.price} {quote.currency}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={handleGetQuote}
            disabled={isProcessing || (state !== "idle" && state !== "error" && state !== "quoted")}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGettingQuote ? (
              <span className="inline-flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Getting Quote...
              </span>
            ) : (
              state === "idle" || state === "error" ? "Get Quote" : "New Quote"
            )}
          </Button>

          {state === "quoted" && (
            <Button
              onClick={() => { void handlePayNow(); }}
              disabled={isPaymentPending || !hasWallet}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaymentPending ? (
                <span className="inline-flex items-center justify-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Payment...
                </span>
              ) : (
                hasWallet ? "Pay Now" : "Connect Wallet to Pay"
              )}
            </Button>
          )}

          {state === "completed" && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700/50 font-semibold py-6 rounded-lg transition-all"
            >
              Start New Request
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {state === "waiting_for_payment" && isPaymentPending && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            <span className="text-yellow-300">Processing payment and waiting for settlement...</span>
          </div>
        )}

        {state === "executing" && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            <span className="text-blue-300">Executing job with LLM canister...</span>
          </div>
        )}

        {/* Payment Success Message */}
        {paymentResult && state === "completed" && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-semibold">Payment Successful</span>
            </div>
            <p className="text-sm text-gray-400">
              Transaction ID: <span className="font-mono text-gray-300">{paymentResult.transactionId}</span>
            </p>
          </div>
        )}

        {/* Job Result */}
        {jobResult && (
          <div className="mt-6 p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Result
            </h3>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {jobResult.output}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Configure VITE_ICPAY_PUBLISHABLE_KEY for live payments.</p>
        <p className="mt-1">Falls back to mock payment when ICPay is not configured.</p>
      </div>
    </div>
  );
}

