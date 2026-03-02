'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Play, Trophy, Users, Target, Zap, Star, ArrowRight, BookOpen, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: {
    text: string;
    href: string;
    variant?: 'default' | 'outline' | 'secondary';
  };
  stats?: {
    label: string;
    value: string;
    icon: React.ReactNode;
  }[];
  gradient: string;
}

const slides: CarouselSlide[] = [
  {
    id: 'rewards',
    title: 'Ready to earn while you build the future?',
    subtitle: '💎 Limited Time Opportunity',
    description: '$100,000 in real rewards up for grabs.',
    image: '',
    cta: {
      text: 'Start Earning Now',
      href: '/quests',
      variant: 'default'
    },
    gradient: 'from-purple-500/20 via-cyan-500/20 to-blue-500/20'
  },
  {
    id: 'assetguard',
    title: 'Secure Your Rewards with AssetGuard',
    subtitle: '🔐 Enterprise-Grade Wallet',
    description: 'Download the secure digital asset wallet for Hedera and link it in the Rewards section to receive your earnings.',
    image: '/THA_Logo.png',
    cta: {
      text: 'Setup Your Wallet',
      href: '/rewards',
      variant: 'default'
    },
    gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20'
  },
  // {
  //   id: 'quests',
  //   title: 'Interactive Learning Quests',
  //   subtitle: 'Learn by Doing',
  //   description: 'Dive into hands-on challenges designed to teach you Hedera development through practical experience. From beginner to expert level.',
  //   image: '🎯',
  //   cta: {
  //     text: 'Explore Quests',
  //     href: '/quests',
  //     variant: 'default'
  //   },
  //   stats: [
  //     { label: 'Difficulty Levels', value: 'TBD', icon: <Star className="w-4 h-4" /> },
  //     { label: 'Categories', value: 'TBD', icon: <BookOpen className="w-4 h-4" /> },
  //     { label: 'Avg Completion', value: 'TBD', icon: <Zap className="w-4 h-4" /> }
  //   ],
  //   gradient: 'from-green-500/20 via-emerald-500/20 to-teal-500/20'
  // },
  // {
  //   id: 'progress',
  //   title: 'Track Your Progress',
  //   subtitle: 'Level Up Your Skills',
  //   description: 'Monitor your learning journey with detailed analytics, earn badges, and climb the leaderboard as you master Hedera development.',
  //   image: '📈',
  //   cta: {
  //     text: 'View Progress',
  //     href: '/progress',
  //     variant: 'default'
  //   },
  //   stats: [
  //     { label: 'XP System', value: 'Gamified', icon: <Trophy className="w-4 h-4" /> },
  //     { label: 'Badges', value: 'TBD', icon: <Award className="w-4 h-4" /> },
  //     { label: 'Leaderboard', value: 'Global', icon: <TrendingUp className="w-4 h-4" /> }
  //   ],
  //   gradient: 'from-yellow-500/20 via-orange-500/20 to-red-500/20'
  // }
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full">
      {/* Main Carousel */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-background/50 to-muted/20">
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br ',
          currentSlideData.gradient
        )} />
        
        <div className="relative z-10 p-6 md:p-8 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center min-h-[350px]">
            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-6">
                <Badge variant="outline" className="font-mono border-dashed bg-primary/10">
                  {currentSlideData.subtitle}
                </Badge>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-mono leading-tight">
                  {currentSlideData.title}
                </h1>
                
{currentSlideData.id === 'rewards' ? (
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-5xl md:text-6xl lg:text-7xl font-black font-mono bg-gradient-to-r from-primary via-purple-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-2xl">
                      $100,000
                    </p>
                    <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-mono">
                      in real rewards up for grabs.
                    </p>
                  </div>
                ) : (
                  <p className="text-lg md:text-xl text-muted-foreground">
                    {currentSlideData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Visual Element */}
            <div className="hidden lg:flex items-center justify-center">
              <Image 
                src={currentSlideData.image || "/quest png.png"} 
                alt={currentSlideData.id === 'assetguard' ? 'AssetGuard Wallet' : 'Quest Logo'} 
                width={300} 
                height={300} 
                className="object-contain" 
              />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-dashed hover:border-solid"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border-dashed hover:border-solid"
          onClick={nextSlide}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-3 h-3 rounded-full border-2 border-dashed transition-all duration-200',
              index === currentSlide
                ? 'bg-primary border-primary border-solid'
                : 'bg-transparent border-primary/30 hover:border-primary/60'
            )}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-muted/30 rounded-full h-1 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300 ease-out"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}