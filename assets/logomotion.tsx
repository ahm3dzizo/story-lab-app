import React, { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, Animated, Dimensions, Easing, TouchableOpacity, Text } from "react-native";
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { routes } from '@/app/routes';

const { width, height } = Dimensions.get('window');

// عداد فريد عالمي على مستوى الملف
let GLOBAL_UNIQUE_COUNTER = 0;

interface ParticleProps {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

interface ParticleData extends ParticleProps {
  id: string;
}

// Create a better centered Particle component
const Particle = ({ x, y, size, color, duration, delay }: ParticleProps) => {
  // Create animated values with initial position at exact center
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  
  // Create separate X and Y values for more control
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Calculate destination based on random angle instead of random offsets
    const angle = Math.random() * Math.PI * 2; // Random angle in radians (0-360 degrees)
    const distance = 150 + Math.random() * 350; // Random distance from center (150-500px)
    
    // Calculate destination coordinates using trigonometry
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;
    
    // Delay the start of the particle animation
    const animationTimeout = setTimeout(() => {
      Animated.parallel([
        // Opacity animation: Fade in quickly, stay visible, then fade out slowly
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: duration * 0.4, 
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.6,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        
        // Scale animation: Grow quickly then slowly shrink
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.8 + Math.random() * 0.7, // Larger maximum scale
            duration: duration * 0.3,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: duration * 0.7,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        
        // X position animation (smoother with easing)
        Animated.timing(translateX, {
          toValue: destX,
          duration: duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // Y position animation (smoother with easing)
        Animated.timing(translateY, {
          toValue: destY,
          duration: duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(animationTimeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        // Position exactly at center initially (x, y are now the center coordinates)
        left: x,
        top: y,
        transform: [
          { translateX },
          { translateY },
          { scale }
        ],
        opacity,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
};

export default function AnimatedLogo() {
  // Values for the icon animation
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const iconPosition = useRef(new Animated.ValueXY({
    x: width/2,  // Center initially
    y: height/2
  })).current;
  
  // Values for the logo animation
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  // Particles state
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [skipVisible, setSkipVisible] = useState(true);

  // أعد تعيين العداد العالمي عند تحميل المكون
  useEffect(() => {
    GLOBAL_UNIQUE_COUNTER = 0;
    // Wait a brief moment before starting animation to ensure screen is ready
    const timer = setTimeout(() => {
      startAnimation();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize animation values on focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset global counter on focus
      GLOBAL_UNIQUE_COUNTER = 0;
      
      // Reset state when screen comes into focus
      setParticles([]);
      setAnimationComplete(false);
      setAnimationStarted(false);
      setSkipVisible(true);
      
      // Reset animation values
      iconScale.setValue(0.8);
      iconRotation.setValue(0);
      iconPosition.setValue({ x: width/2, y: height/2 });
      logoScale.setValue(0);
      logoOpacity.setValue(0);
      
      // Auto-start animation after a short delay
      const timer = setTimeout(() => {
        startAnimation();
      }, 500);
      
      return () => {
        // Clear all animations and state when component unmounts or loses focus
        setParticles([]);
        clearTimeout(timer);
        
        // Reset animation values
        iconScale.setValue(0.8);
        iconRotation.setValue(0);
        iconPosition.setValue({ x: width/2, y: height/2 });
        logoScale.setValue(0);
        logoOpacity.setValue(0);
        
        // Set completion states to avoid lingering animations
        setAnimationComplete(true);
        setAnimationStarted(false);
      };
    }, [])
  );

  // Navigate to main app
  const navigateToApp = () => {
    router.replace(routes.app.dashboard);
  };

  // Skip the intro animation
  const skipIntro = () => {
    // Clear any animations and particles
    setParticles([]);
    setAnimationStarted(false);
    setAnimationComplete(true);
    setSkipVisible(false);
    
    // Navigate to main app
    navigateToApp();
  };

  // Start the animation sequence
  const startAnimation = () => {
    setAnimationStarted(true);
    
    // Phase 1: Icon scales and rotates side to side
    Animated.sequence([
      // Grow icon
      Animated.timing(iconScale, {
        toValue: 2.5, // Scale icon more
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      
      // Hold briefly
      Animated.delay(200),
    ]).start();
    
    // Oscillate rotation left and right
    Animated.sequence([
      // Rotate right
      Animated.timing(iconRotation, {
        toValue: 0.1,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // Rotate left
      Animated.timing(iconRotation, {
        toValue: -0.1,
        duration: 800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // Rotate right again
      Animated.timing(iconRotation, {
        toValue: 0.1,
        duration: 800,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // Return to center
      Animated.timing(iconRotation, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    
    // Phase 2: Trigger particle explosion from center after short delay
    setTimeout(() => {
      triggerExplosion();
      
      // Phase 3: Start shrinking icon - make it completely disappear before logo appears
      const iconFadeOut = Animated.timing(iconScale, {
        toValue: 0, // Scale all the way to 0 instead of 0.3
        duration: 700, // Faster duration to ensure it's gone before logo appears
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      });
      
      // Start the icon fade out
      iconFadeOut.start();
      
      // Phase 4: Logo comes out AFTER icon is completely hidden
      setTimeout(() => {
        // Grow and fade in logo
        Animated.parallel([
          Animated.timing(logoScale, {
            toValue: 1.8, // Scale logo more
            duration: 800,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Clean final animation
          Animated.parallel([
            // Logo settles to normal size, but still larger than before
            Animated.timing(logoScale, {
              toValue: 1.4,
              duration: 500,
              easing: Easing.out(Easing.bounce),
              useNativeDriver: true,
            }),
          ]).start();
          
          setAnimationComplete(true);
          
          // Hide skip button
          setSkipVisible(false);
          
          // Wait a moment then navigate to the main app
          setTimeout(() => {
            navigateToApp();
          }, 1500);
        });
      }, 800); // Increased delay to ensure icon is completely gone (700ms to fade + 100ms buffer)
    }, 1000);
  };

  const triggerExplosion = () => {
    // The exact center of the screen
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Enhanced color palette with more fire-like colors
    const colors = [
      '#ff4500', '#ff7300', '#ffeb00', '#ff0000', '#ffaa00',  // Orange/red base
      '#ff6347', '#ff8c00', '#ffd700', '#ff5733', '#ff9966',  // Orange variants
      '#ffcc00', '#ff3300', '#ff6600', '#ffb700', '#ff5e00'   // Additional warm tones
    ];
    
    // Create a new wave of particles
    const createParticleWave = (count: number, options: {
      delayBase?: number,
      delayRandom?: number,
      sizeBase?: number,
      sizeRandom?: number,
      durationBase?: number,
      durationRandom?: number,
      waveId?: string
    } = {}) => {
      const {
        delayBase = 0,
        delayRandom = 100,
        sizeBase = 4,
        sizeRandom = 3,
        durationBase = 2000,
        durationRandom = 1000,
        waveId = String(Date.now())
      } = options;
      
      const newParticles: ParticleData[] = [];
      
      for (let i = 0; i < count; i++) {
        // زيادة العداد العالمي لكل جسيم
        GLOBAL_UNIQUE_COUNTER++;
        
        // إنشاء معرف حقًا فريد باستخدام مزيج من الوقت والعداد العالمي
        newParticles.push({
          id: `particle-${waveId}-${i}-${GLOBAL_UNIQUE_COUNTER}-${Math.random().toString(36).substring(2, 9)}`,
          x: centerX,  // Always start from center X
          y: centerY,  // Always start from center Y
          size: sizeBase + Math.random() * sizeRandom,
          color: colors[Math.floor(Math.random() * colors.length)],
          duration: durationBase + Math.random() * durationRandom,
          delay: delayBase + Math.random() * delayRandom
        });
      }
      
      return newParticles;
    };
    
    // Create wave IDs upfront to ensure uniqueness
    const wave1Id = `w1-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const wave2Id = `w2-${Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`;
    const wave3Id = `w3-${Date.now() + 2}-${Math.random().toString(36).substring(2, 9)}`;
    const wave4Id = `w4-${Date.now() + 3}-${Math.random().toString(36).substring(2, 9)}`;
    const wave5Id = `w5-${Date.now() + 4}-${Math.random().toString(36).substring(2, 9)}`;
    const wave6Id = `w6-${Date.now() + 5}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a massive particle explosion in sequential waves
    // Initial burst - smaller, faster particles
    setParticles(createParticleWave(45, {
      delayBase: 0,
      delayRandom: 50,
      sizeBase: 3,
      sizeRandom: 2,
      durationBase: 1500,
      durationRandom: 500,
      waveId: wave1Id
    }));
    
    // Second wave - medium particles
    setTimeout(() => {
      setParticles(prev => [
        ...prev,
        ...createParticleWave(50, {
          delayBase: 100,
          delayRandom: 100,
          sizeBase: 4,
          sizeRandom: 3,
          durationBase: 2000,
          durationRandom: 800,
          waveId: wave2Id
        })
      ]);
    }, 100);
    
    // Third wave - larger particles
    setTimeout(() => {
      setParticles(prev => [
        ...prev,
        ...createParticleWave(60, {
          delayBase: 250,
          delayRandom: 150,
          sizeBase: 5,
          sizeRandom: 4,
          durationBase: 2500,
          durationRandom: 1000,
          waveId: wave3Id
        })
      ]);
    }, 250);
    
    // Fourth wave - largest particles
    setTimeout(() => {
      setParticles(prev => [
        ...prev,
        ...createParticleWave(55, {
          delayBase: 400,
          delayRandom: 200,
          sizeBase: 6,
          sizeRandom: 4,
          durationBase: 3000,
          durationRandom: 1200,
          waveId: wave4Id
        })
      ]);
    }, 400);
    
    // Fifth wave - medium/large with longer delay
    setTimeout(() => {
      setParticles(prev => [
        ...prev,
        ...createParticleWave(40, {
          delayBase: 650,
          delayRandom: 250,
          sizeBase: 5,
          sizeRandom: 3,
          durationBase: 2800,
          durationRandom: 1000,
          waveId: wave5Id
        })
      ]);
    }, 650);
    
    // Final burst - small quick particles for a finishing touch
    setTimeout(() => {
      setParticles(prev => [
        ...prev,
        ...createParticleWave(50, {
          delayBase: 900,
          delayRandom: 300,
          sizeBase: 3,
          sizeRandom: 2,
          durationBase: 2000,
          durationRandom: 800,
          waveId: wave6Id
        })
      ]);
    }, 900);
  };

  // Convert rotation value to rotation string
  const spin = iconRotation.interpolate({
    inputRange: [-0.1, 0, 0.1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  return (
    <View style={styles.container}>
      {/* Render particles */}
      {particles.map(particle => (
        <Particle
          key={particle.id}
          x={particle.x}
          y={particle.y}
          size={particle.size}
          color={particle.color}
          duration={particle.duration}
          delay={particle.delay}
        />
      ))}

      {/* Logo (perfectly centered) */}
      <Animated.Image 
        source={require('./images/2.png')} 
        style={[
          styles.logo,
          {
            left: (width - 220) / 2, // Center horizontally based on logo width
            top: (height - 220) / 2, // Center vertically based on logo height
            opacity: logoOpacity,
            transform: [{ scale: logoScale }]
          }
        ]} 
      />

      {/* Icon (centered) */}
      <Animated.Image
        source={require('./images/1.png')}
        style={[
          styles.icon,
          {
            // Position at exact center
            left: width/2 - 50, // Half of icon width (100/2)
            top: height/2 - 50, // Half of icon height (100/2)
            transform: [
              { scale: iconScale },
              { rotate: spin }
            ]
          }
        ]}
      />

      {/* Skip button */}
      {skipVisible && (
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={skipIntro}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  logo: {
    width: 220, // Increased base size
    height: 220, // Increased base size
    resizeMode: 'contain',
    position: 'absolute',
  },
  icon: {
    width: 100, // Increased base size
    height: 100, // Increased base size
    resizeMode: 'contain',
    position: 'absolute',
    left: -50, // Adjusted for new size
    top: -50,  // Adjusted for new size
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});
