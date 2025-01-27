import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, FileText, MessageSquare, School } from "lucide-react";

const Home = () => {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };



  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/20">
      {/* Hero Section */}
      <section className="relative py-20 px-14 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_50%)]" />
        <motion.div 
          className="container px-4 mx-auto relative"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div className="flex-1 text-center lg:text-left" variants={itemVariants}>
              <motion.h1 
                className="text-4xl lg:text-6xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 dark:from-violet-400 dark:via-primary dark:to-indigo-400 bg-clip-text text-transparent">
                  Transform Your Learning with{" "}
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-violet-600 to-primary bg-clip-text text-transparent">
                    AI
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-primary/20 dark:bg-primary/30 blur-xl rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </span>
              </motion.h1>
              <motion.p 
                className="text-lg text-muted-foreground mb-8"
                variants={itemVariants}
              >
                PrepOnyx combines AI-powered mock interviews, smart PDF analysis, and personalized course creation to revolutionize your learning experience.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                variants={itemVariants}
              >
                <motion.div whileHover="hover">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/10 bg-black/20 hover:bg-black/30 backdrop-blur-sm"
                >
                  Learn More
                </Button>
              </motion.div>
            </motion.div>

            {/* Video Showcase */}
            <motion.div 
              className="flex-1 relative"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10 backdrop-blur-sm">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/assets/video/logic_ledger_final.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-purple-500/20 blur-xl -z-10" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.1),transparent_50%)]" />
        <motion.div 
          className="container px-4 mx-auto relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-muted-foreground">
              Everything you need to succeed in your career journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                className="group relative bg-white/5 dark:bg-black/20 p-6 rounded-xl border border-primary/10 hover:border-primary/30 backdrop-blur-sm transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="w-12 h-12 text-primary group-hover:text-violet-500 transition-colors duration-300 mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-foreground/90 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                  {feature.description}
                </p>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-violet-500 rounded-b-xl"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: MessageSquare,
    title: "AI Mock Interviews",
    description: "Practice with our AI interviewer and get instant feedback to improve your performance."
  },
  {
    icon: FileText,
    title: "PDF Analyzer & Quiz Generator",
    description: "Upload your study materials and get AI-generated quizzes to test your knowledge."
  },
  {
    icon: BookOpen,
    title: "Flashcard Generator",
    description: "Convert your notes into interactive flashcards for effective learning."
  },
  {
    icon: School,
    title: "Personal AI Course Creator",
    description: "Get personalized learning paths based on your goals and preferences."
  },
  {
    icon: Brain,
    title: "AI Math Notes Converter",
    description: "Transform handwritten math notes into detailed solutions and explanations."
  }
];

export default Home;