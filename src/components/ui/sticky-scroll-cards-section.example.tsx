/**
 * Example usage of StickyFeatureSection component
 * 
 * This component creates a sticky scroll effect where cards stack on top of each other
 * as you scroll, creating an engaging visual experience.
 */

import { StickyFeatureSection } from "@/components/ui/sticky-scroll-cards-section";

// Example 1: Using default features and animated header
export function ExampleDefault() {
  return (
    <div className="w-full">
      <StickyFeatureSection />
    </div>
  );
}

// Example 2: Custom features with custom header
export function ExampleCustom() {
  const customFeatures = [
    {
      title: "Feature One",
      description: "Description of feature one with custom content.",
      imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=2070&auto=format&fit=crop",
      bgColor: "bg-blue-200 dark:bg-blue-800",
      textColor: "text-gray-700 dark:text-gray-200"
    },
    {
      title: "Feature Two",
      description: "Description of feature two with custom content.",
      imageUrl: "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?q=80&w=1974&auto=format&fit=crop",
      bgColor: "bg-green-200 dark:bg-green-800",
      textColor: "text-gray-700 dark:text-gray-200"
    },
  ];

  return (
    <div className="w-full">
      <StickyFeatureSection 
        features={customFeatures}
        headerTitle="Custom Header Title"
        headerDescription="Custom header description text"
        stickyTop="150px" // Adjust sticky position
      />
    </div>
  );
}

// Example 3: Minimal usage with just custom header
export function ExampleMinimal() {
  return (
    <div className="w-full">
      <StickyFeatureSection 
        headerTitle="Our Features"
        headerDescription="Discover what makes us different"
      />
    </div>
  );
}
