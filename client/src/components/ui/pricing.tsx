"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import {VerticalCutReveal} from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { Briefcase, CheckCheck, Database, Server } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Starter",
    description:
      "Great for small businesses and startups looking to get started with AI",
    price: 12,
    yearlyPrice: 99,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    features: [
      { text: "Up to 10 boards per workspace", icon: <Briefcase size={20} /> },
      { text: "Up to 10GB storage", icon: <Database size={20} /> },
      { text: "Limited analytics", icon: <Server size={20} /> },
    ],
    includes: [
      "Free includes:",
      "Unlimted Cards",
      "Custom background & stickers",
      "2-factor authentication",
      "Up to 2 individual users",
      "Up to 2 workspaces",
    ],
  },
  {
    name: "Business",
    description:
      "Best value for growing businesses that need more advanced features",
    price: 48,
    yearlyPrice: 399,
    buttonText: "Get started",
    buttonVariant: "default" as const,
    popular: true,
    features: [
      { text: "Unlimted boards", icon: <Briefcase size={20} /> },
      { text: "Storage (250MB/file)", icon: <Database size={20} /> },
      { text: "100 workspace command runs", icon: <Server size={20} /> },
    ],
    includes: [
      "Everything in Starter, plus:",
      "Advanced checklists",
      "Custom fields",
      "Servedless functions",
      "Up to 10 individual users",
      "Up to 10 workspaces",
    ],
  },
  {
    name: "Enterprise",
    description:
      "Advanced plan with enhanced security and unlimited access for large teams",
    price: 96,
    yearlyPrice: 899,
    buttonText: "Get started",
    buttonVariant: "outline" as const,
    features: [
      { text: "Unlimited board", icon: <Briefcase size={20} /> },
      { text: "Unlimited storage ", icon: <Database size={20} /> },
      { text: "Unlimited workspaces", icon: <Server size={20} /> },
    ],
    includes: [
      "Everything in Business, plus:",
      "Multi-board management",
      "Multi-board guest",
      "Attachment permissions",
      "Custom roles",
      "Custom boards",
    ],
  },
];

const PricingSwitch = ({
  onSwitch,
  className,
}: {
  onSwitch: (value: string) => void;
  className?: string;
}) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-xl bg-neutral-50 border border-gray-200 p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm",
            selected === "0"
              ? "text-white"
              : "text-muted-foreground hover:text-black",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0  h-12 w-full rounded-xl border-4 shadow-sm shadow-orange-600 border-orange-600 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly Billing</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit cursor-pointer h-12 flex-shrink-0 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm",
            selected === "1"
              ? "text-white"
              : "text-muted-foreground hover:text-black",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0  h-12 w-full rounded-xl border-4 shadow-sm shadow-orange-600 border-orange-600 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Yearly Billing
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-black">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default function PricingSection5({ 
  plans: dynamicPlans = [],
  onAction,
  activePlanId,
  isProcessing
}: any) {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { delay: i * 0.4, duration: 0.5 },
    }),
    hidden: { filter: "blur(10px)", y: -20, opacity: 0 },
  };

  const togglePricingPeriod = (value: string) => setIsYearly(Number.parseInt(value) === 1);

  const displayPlans = dynamicPlans.length > 0 ? dynamicPlans.map((p: any) => {
    const parsedFeatures = Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []);
    return {
      id: p.id,
      name: p.name,
      description: `Up to ${p.maxStudents === 999999 ? 'Unlimited' : p.maxStudents} Students`,
      price: p.price,
      yearlyPrice: p.price, // assuming the API returns correct price for interval
      interval: p.interval,
      buttonText: p.id === activePlanId ? "Current Plan" : (p.price === 0 ? "Downgrade" : "Upgrade"),
      buttonVariant: p.highlight ? "default" : "outline",
      popular: p.highlight,
      features: parsedFeatures,
      includes: ["Premium Features:", ...parsedFeatures],
      rawPlan: p
    };
  }) : plans;

  return (
    <div className="pt-8 min-h-screen max-w-7xl mx-auto relative" ref={pricingRef}>
      <article className="text-left mb-6 space-y-4 max-w-2xl">
        <h2 className="md:text-5xl text-3xl capitalize font-medium text-gray-900 mb-4">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-start"
            transition={{ type: "spring", stiffness: 250, damping: 40, delay: 0 }}
          >
            We've got a plan that's perfect for you
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="md:text-base text-sm text-gray-600 w-[80%]"
        >
          Explore which option is right for your institute to provide premium access to your students.
        </TimelineContent>
      </article>

      <div className="grid md:grid-cols-3 gap-6 py-6">
        {displayPlans.map((plan: any, index: number) => {
          const isCurrent = plan.id === activePlanId;
          return (
            <TimelineContent
              key={plan.name}
              as="div"
              animationNum={2 + index}
              timelineRef={pricingRef}
              customVariants={revealVariants}
            >
              <Card
                className={`relative border transition-all duration-300 hover:-translate-y-1 h-full flex flex-col ${
                  plan.popular || isCurrent
                    ? "ring-2 ring-indigo-500 bg-indigo-50 border-transparent shadow-xl"
                    : "bg-white border-neutral-200"
                }`}
              >
                <CardHeader className="text-left flex-none">
                  <div className="flex justify-between">
                    <h3 className="xl:text-3xl md:text-2xl text-3xl font-semibold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    {plan.popular && !isCurrent && (
                      <div>
                        <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Popular
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div>
                        <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Current
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="xl:text-sm md:text-xs text-sm text-gray-600 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-semibold text-gray-900">
                      ₹
                      <NumberFlow
                        format={{ currency: "INR" }}
                        value={isYearly ? plan.yearlyPrice : plan.price}
                        className="text-4xl font-semibold"
                      />
                    </span>
                    <span className="text-gray-600 ml-1">
                      /{plan.interval || (isYearly ? "year" : "month")}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  <button
                    onClick={() => onAction && onAction(plan.rawPlan)}
                    disabled={isProcessing === plan.id}
                    className={`w-full mb-6 p-3 text-lg font-medium rounded-xl transition-all disabled:opacity-70 ${
                      plan.popular || isCurrent
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-500/30 text-white border border-indigo-400"
                        : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 shadow-sm"
                    }`}
                  >
                    {isProcessing === plan.id ? "Processing..." : plan.buttonText}
                  </button>

                  <div className="space-y-3 pt-4 border-t border-neutral-200 mt-auto">
                    <h2 className="text-lg font-semibold uppercase text-gray-900 mb-3">
                      Features
                    </h2>
                    <ul className="space-y-3 font-medium">
                      {plan.features.map((feature: any, featureIndex: number) => (
                        <li key={featureIndex} className="flex items-start">
                          <span className="flex-shrink-0 h-5 w-5 bg-white border border-indigo-500 rounded-full grid place-content-center mt-0.5 mr-3">
                            {feature.icon ? feature.icon : <CheckCheck className="h-3 w-3 text-indigo-500" />}
                          </span>
                          <span className="text-sm text-gray-600 leading-snug">
                            {typeof feature === "string" ? feature : feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TimelineContent>
          );
        })}
      </div>
    </div>
  );
}
