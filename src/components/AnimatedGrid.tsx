const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black">
      <div className="absolute h-full w-full">
        {/* Animated grid */}
        <div className="absolute inset-0 bg-grid-slate-200/[0.04] bg-[size:75px_75px] dark:bg-grid-slate-50/[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-black" />
        
        {/* Radial gradient for spotlight effect */}
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-primary/20 opacity-50 blur-[100px]" />
      </div>
    </div>
  );
};

export default AnimatedGrid; 