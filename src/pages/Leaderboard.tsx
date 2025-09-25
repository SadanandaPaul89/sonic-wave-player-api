import React from 'react';
import Leaderboard from '@/components/Leaderboard';
import PageTransition from '@/components/PageTransition';

const LeaderboardPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <Leaderboard />
      </div>
    </PageTransition>
  );
};

export default LeaderboardPage;
