import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Music, Search, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#0A0A0A] to-[#1A1A2E] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-[#34D399]/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Animated 404 with music notes */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8"
        >
          <div className="relative inline-block">
            <h1 className="text-[150px] md:text-[200px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#10B981] leading-none">
              404
            </h1>
            
            {/* Floating music notes */}
            <motion.div
              className="absolute -top-8 -right-8 text-[#10B981]"
              animate={{
                y: [-10, 10, -10],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Music size={48} />
            </motion.div>
            
            <motion.div
              className="absolute -bottom-4 -left-8 text-[#34D399]"
              animate={{
                y: [10, -10, 10],
                rotate: [0, -10, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Headphones size={40} />
            </motion.div>
          </div>
        </motion.div>

        {/* Hilarious yet professional message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Oops! This Track Doesn't Exist
          </h2>
          
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
            Looks like this page went on tour and forgot to come back. 🎸
          </p>
          
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Even our best DJ couldn't find this mix. Maybe it's a remix that never dropped, 
            or perhaps it's still in the studio being perfected.
          </p>

          <div className="pt-4">
            <p className="text-md text-[#10B981] font-medium">
              Error Code: TRACK_NOT_FOUND_IN_LIBRARY
            </p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[#10B981] to-[#34D399] hover:from-[#34D399] hover:to-[#10B981] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Home className="mr-2" size={20} />
            Back to Home
          </Button>
          
          <Button
            onClick={() => navigate('/search')}
            variant="outline"
            className="border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981] hover:text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Search className="mr-2" size={20} />
            Search Music
          </Button>
        </motion.div>

        {/* Fun suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
        >
          <h3 className="text-xl font-semibold text-white mb-4">
            While You're Here, Try These Instead:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <button
              onClick={() => navigate('/')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 text-white/80 hover:text-white"
            >
              <Music className="mb-2 text-[#10B981]" size={24} />
              <p className="font-medium">Discover New Music</p>
              <p className="text-sm text-white/60">Fresh tracks daily</p>
            </button>
            
            <button
              onClick={() => navigate('/library')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 text-white/80 hover:text-white"
            >
              <Headphones className="mb-2 text-[#10B981]" size={24} />
              <p className="font-medium">Your Library</p>
              <p className="text-sm text-white/60">Your saved tracks</p>
            </button>
            
            <button
              onClick={() => navigate('/leaderboard')}
              className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 text-white/80 hover:text-white"
            >
              <Music className="mb-2 text-[#10B981]" size={24} />
              <p className="font-medium">Top Charts</p>
              <p className="text-sm text-white/60">Trending now</p>
            </button>
          </div>
        </motion.div>

        {/* Easter egg */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 text-sm text-white/40 italic"
        >
          "404 - The only number that sounds better than 808" 🎵
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;
