"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock, Users, Car, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { collection, getDocs, getFirestore, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const features = [
  {
    icon: Clock,
    title: "Working on cars for more than 27 years",
    description: "With decades of experience, we ensure your car is in expert hands.",
  },
  {
    icon: Users,
    title: "Hired skilled mechanics",
    description: "Our team consists of highly skilled mechanics dedicated to providing top-notch service.",
  },
  {
    icon: Car,
    title: "Fixed compact to exotic cars",
    description: "From compact cars to exotic vehicles, we have successfully repaired a wide range of automobiles.",
  },
  {
    icon: Shield,
    title: "Treat vehicles like it's ours",
    description: "We handle every vehicle with the utmost care, treating it as if it were our own.",
  },
];

// Type definition for Expert
interface Expert {
  id: string;
  name: string;
  position: string;
  location: string;
  quote: string;
  image: string;
}

// Skeleton Loading Component
const ExpertCardSkeleton = () => (
  <div className="w-1/2 md:w-1/3 animate-pulse">
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="aspect-[3/2] bg-gray-300"></div>
      <div className="p-4 md:p-5">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  </div>
);

// Swipeable Cards Component
const SwipeableCards = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const cardsContainerRef = useRef(null);
  const [direction, setDirection] = useState('');

  // Fetch experts from Firestore with performance optimization
  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const expertsCollection = collection(db, 'employees');
        const querySnapshot = await getDocs(expertsCollection);
        
        querySnapshot.docs.forEach(doc => {
          console.log('Expert Document:', {
            id: doc.id,
            data: doc.data()
          });
        });
      } catch (error) {
        console.error("Error fetching experts:", error);
      }
    };
  
    fetchExperts();
  }, []);
  // Memoize indices to prevent unnecessary recalculations
  const prevIndex = useMemo(() => 
    currentIndex === 0 ? experts.length - 1 : currentIndex - 1, 
    [currentIndex, experts.length]
  );

  const nextIndex = useMemo(() => 
    currentIndex === experts.length - 1 ? 0 : currentIndex + 1, 
    [currentIndex, experts.length]
  );

  // Navigation and interaction handlers
  const nextCard = useCallback(() => {
    if (animating || isLoading) return;
    setAnimating(true);
    setDirection('right');
    setCurrentIndex(prev => prev < experts.length - 1 ? prev + 1 : 0);
    setTimeout(() => {
      setAnimating(false);
      setDirection('');
    }, 400);
  }, [animating, isLoading, experts.length]);

  const prevCard = useCallback(() => {
    if (animating || isLoading) return;
    setAnimating(true);
    setDirection('left');
    setCurrentIndex(prev => prev > 0 ? prev - 1 : experts.length - 1);
    setTimeout(() => {
      setAnimating(false);
      setDirection('');
    }, 400);
  }, [animating, isLoading, experts.length]);

  // Error or loading state rendering
  if (isLoading) {
    return (
      <div className="relative w-full py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-stretch gap-4 md:gap-6 relative">
            <ExpertCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="ml-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  // No experts found
  if (experts.length === 0) {
    return (
      <div className="flex justify-center items-center h-96 text-gray-500">
        <p>No experts found</p>
      </div>
    );
  }

  return (
    <div className="relative w-full py-10">
      {/* Navigation buttons */}
      <button 
        onClick={prevCard} 
        disabled={isLoading}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-transform duration-300 hover:scale-110 disabled:opacity-50"
        aria-label="Previous expert"
      >
        <ChevronLeft className="w-6 h-6 text-primary" />
      </button>
      
      <button 
        onClick={nextCard} 
        disabled={isLoading}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-transform duration-300 hover:scale-110 disabled:opacity-50"
        aria-label="Next expert"
      >
        <ChevronRight className="w-6 h-6 text-primary" />
      </button>
      
      {/* Three-card view container */}
      <div className="max-w-6xl mx-auto px-4">
        <div 
          ref={cardsContainerRef}
          className="overflow-hidden w-full"
        >
          {/* Main visible cards - always show 3 cards with center card highlighted */}
          <div className="flex justify-center items-stretch gap-4 md:gap-6 relative">
            {/* Previous card (smaller) */}
            <div className={`w-1/4 md:w-1/3 flex-shrink-0 opacity-70 transform scale-90 transition-all duration-400 ${direction === 'left' ? 'animate-slide-out-left' : direction === 'right' ? 'animate-slide-in-left' : ''} ${offsetX > 0 ? 'translate-x-3' : ''}`}>
              <div className="bg-white rounded-xl shadow-md overflow-hidden h-full transition-shadow duration-300 hover:shadow-lg">
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img
                    src={experts[prevIndex].image || "/placeholder.svg"}
                    alt={`${experts[prevIndex].name} working on a car`}
                    className="w-full h-full object-cover transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{experts[prevIndex].name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{experts[prevIndex].position} · {experts[prevIndex].location}</p>
                </div>
              </div>
            </div>

            {/* Current card (larger, highlighted) */}
            <div className={`w-1/2 md:w-1/3 flex-shrink-0 z-10 transform scale-105 shadow-xl transition-all duration-400 ${animating ? 'animate-pulse-subtle' : ''}`} 
                style={{ transform: `scale(1.05) translateX(${offsetX * 0.2}px)` }}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full transition-all duration-300">
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img
                    src={experts[currentIndex].image || "/placeholder.svg"}
                    alt={`${experts[currentIndex].name} working on a car`}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{experts[currentIndex].name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{experts[currentIndex].position} · {experts[currentIndex].location}</p>
                  <blockquote className="text-base text-gray-700">"{experts[currentIndex].quote}"</blockquote>
                </div>
              </div>
            </div>

            {/* Next card (smaller) */}
            <div className={`w-1/4 md:w-1/3 flex-shrink-0 opacity-70 transform scale-90 transition-all duration-400 ${direction === 'right' ? 'animate-slide-out-right' : direction === 'left' ? 'animate-slide-in-right' : ''} ${offsetX < 0 ? 'translate-x-[-0.75rem]' : ''}`}>
              <div className="bg-white rounded-xl shadow-md overflow-hidden h-full transition-shadow duration-300 hover:shadow-lg">
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img
                    src={experts[nextIndex].image || "/placeholder.svg"}
                    alt={`${experts[nextIndex].name} working on a car`}
                    className="w-full h-full object-cover transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 md:p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{experts[nextIndex].name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{experts[nextIndex].position} · {experts[nextIndex].location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pagination indicators */}
      <div className="flex justify-center mt-8 gap-2">
        {experts.map((_, index) => (
          <button
            key={index}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === index ? 'bg-primary scale-125' : 'bg-gray-300'
            } hover:scale-110`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export function AboutUsSection() {
  return (
    <section id="about" className="relative py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-4xl md:text-3xl font-bold text-primary-dark mb-12">
              We offer the best repairs in town!
            </h2>
            <div className="space-y-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary-dark mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[600px]">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gtr%20car-ZBbiknPR8nBiJkPN69iY2vvrYvk7oQ.png"
              alt="Blue Nissan GTR"
              className="w-full h-full object-contain drop-shadow-xl"
              loading="lazy"
            />
          </div>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">
            <span className="text-primary-dark">Meet the Experts</span>{" "}
            <span className="text-secondary">Keeping Your Car in Top Gear!</span>
          </h2>
          <p className="text-gray-600 mt-4 md:hidden">Swipe left or right to meet our team of professionals</p>
        </div>

        {/* Swipeable Cards Component */}
        <SwipeableCards />
      </div>
    </section>
  );
}

export default AboutUsSection;