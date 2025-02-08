import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, FileText, MessageSquare, School } from "lucide-react";
import { AnimatedGridPattern } from "@/components/ui/AnimatedGridPattern";
import { Link } from "react-router-dom";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const Home = () => {
  return (
    <div className="min-h-screen w-full dark:bg-black bg-white relative overflow-hidden">
      {/* Animated Grid Background */}
      <AnimatedGridPattern
        width={40}
        height={40}
        numSquares={30}
        maxOpacity={0.2}
        duration={6}
        repeatDelay={1}
        className="opacity-50 [&>svg]:fill-white/10 [&>svg]:stroke-white/10"
      />

      {/* Radial gradient adjustment */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_100%)] z-20" />

      {/* Hero Section - Enhanced z-index hierarchy */}
      <section className="relative z-30 py-32 px-6 lg:px-8 overflow-hidden">
        <div className="container mx-auto max-w-7xl relative">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Content */}
            <motion.div className="space-y-8 text-center lg:text-left" variants={itemVariants}>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Transform Your Career with
                </span>
                <span className="block mt-4">AI-Powered Learning</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                PrepOnyx is your ultimate AI-driven platform designed to revolutionize your learning experience. From mock interviews to personalized courses, we provide the tools you need to excel in your career journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 transition-all"
                >
                  <Link to="/signup">Get Started</Link>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>

            {/* Video Showcase - Mobile Optimized */}
            <motion.div 
              className="flex-1 relative sm:h-96 w-full aspect-video max-w-[2000] mx-auto px-4 sm:px-0"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10 backdrop-blur-sm h-full w-full">
                <div className="absolute inset-0 bg-black/20 z-10" />
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/assets/video/preponyx_new_demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:scale-105 transition-transform">
                    <svg 
                      className="w-8 h-8 text-white" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent z-15" />
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-purple-500/20 blur-2xl opacity-50 -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Added z-index */}
      <section className="relative z-10 py-24 bg-background/50">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-2xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Unlock Your Potential
            </h2>
            <p className="text-muted-foreground">
              Discover a suite of powerful features tailored to help you master your skills, ace interviews, and achieve your career goals.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  transition: {
                    duration: 0.2,
                    ease: "easeOut"
                  }
                }}
                className="group relative bg-card p-8 rounded-xl border border-border/50 hover:border-primary/30 backdrop-blur-sm transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="p-3 bg-primary/10 rounded-lg w-12 h-12 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description: "Practice with our advanced AI interviewer that simulates real-world scenarios. Receive instant feedback on your responses, body language, and communication skills to improve your performance."
  },
  {
    icon: FileText,
    title: "PDF Analyzer & Quiz Generator",
    description: "Upload your study materials, and our AI will analyze the content to generate tailored quizzes. Test your knowledge and reinforce learning with precision."
  },
  {
    icon: BookOpen,
    title: "Flashcard Generator",
    description: "Convert your notes into interactive flashcards for efficient and effective learning. Our AI ensures the flashcards are optimized for retention and recall."
  },
  {
    icon: School,
    title: "Personal AI Course Creator",
    description: "Get personalized learning paths based on your career goals and skill gaps. Our AI curates courses to help you master the skills you need."
  },
  {
    icon: Brain,
    title: "Skribble AI",
    description: "Transform handwritten mathematical expressions into instant solutions with our AI-powered tool. Perfect for students and professionals alike."
  }
];

export default Home;