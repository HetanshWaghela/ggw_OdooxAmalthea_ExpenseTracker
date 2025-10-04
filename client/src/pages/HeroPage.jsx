import { useScroll, useTransform } from "framer-motion";
import React from "react";
import { GoogleGeminiEffect } from "../components/ui/google-gemini-effect";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";

function HeroPage() {
  const navigate = useNavigate();
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.8], [0, 1.2]);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  return (
    <div
      className="h-[400vh] bg-black w-full dark:border dark:border-white/[0.1] rounded-md relative pt-40 overflow-clip"
      ref={ref}
    >
      <GoogleGeminiEffect
        pathLengths={[
          pathLengthFirst,
          pathLengthSecond,
          pathLengthThird,
          pathLengthFourth,
          pathLengthFifth,
        ]}
        title="Expense Management Made Simple"
        description="Streamline your company's expense tracking with our powerful, intuitive platform. From submission to approval, manage everything in one place."
      />
      
      {/* Fixed Logo - Top Left */}
      <div className="fixed top-6 left-6 z-50">
        <Logo size="w-12 h-12" className="hover:scale-110 transition-transform duration-300" />
      </div>
      
      {/* Fixed Login/Signup Buttons - Top Right */}
      <div className="fixed top-6 right-6 z-50 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleLogin}
          className="bg-white text-black font-bold rounded-full px-6 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform min-w-[100px]"
        >
          Login
        </button>
        <button
          onClick={handleSignup}
          className="bg-transparent border-2 border-white text-white font-bold rounded-full px-6 py-2 text-sm hover:bg-white hover:text-black transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform min-w-[100px]"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}

export default HeroPage;
