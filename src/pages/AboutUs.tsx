import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Music, Users, Heart, Star } from 'lucide-react';

const AboutUs: React.FC = () => {
  const developers = [
    {
      name: "Sadananda Paul",
      note: "Passionate about creating seamless user experiences and bringing innovative ideas to life through code.",
      initials: "SP",
      color: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      name: "Mayank Sen",
      note: "Dedicated to building robust systems that empower artists and connect them with their audience.",
      initials: "MS",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500"
    },
    {
      name: "Avanthika Prathapan",
      note: "Focused on crafting beautiful interfaces that make music discovery an enjoyable journey.",
      initials: "AP",
      color: "bg-gradient-to-br from-green-500 to-emerald-500"
    },
    {
      name: "Hariharan G V",
      note: "Committed to delivering exceptional performance and creating innovative solutions for music lovers.",
      initials: "HG",
      color: "bg-gradient-to-br from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-base via-spotify-elevated to-spotify-base text-spotify-white">
      {/* Hero Section */}
      <div className="relative px-6 py-20 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-spotify-green/20 to-transparent"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-spotify-green/20 rounded-full backdrop-blur-sm">
              <Music className="w-16 h-16 text-spotify-green" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-spotify-white via-spotify-green to-spotify-white bg-clip-text text-transparent">
            About Sonic Wave
          </h1>
          <div className="w-24 h-1 bg-spotify-green mx-auto mb-8"></div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-spotify-green">
              Our Mission
            </h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                <strong className="text-spotify-green">Sonic Wave</strong> is a platform for independent artists to share their masterpieces with the type of audience they need! It has no boundaries and no hidden compliances.
              </p>
              <p>
                For the audiophiles/listeners, Sonic Wave is a platform where you will find all kinds of music directly from the creator without any unwanted interruptions and limits.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green border-spotify-green/50">
                <Users className="w-4 h-4 mr-2" />
                Artist Focused
              </Badge>
              <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green border-spotify-green/50">
                <Heart className="w-4 h-4 mr-2" />
                No Boundaries
              </Badge>
              <Badge variant="secondary" className="bg-spotify-green/20 text-spotify-green border-spotify-green/50">
                <Music className="w-4 h-4 mr-2" />
                Pure Music
              </Badge>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-spotify-green/30 to-purple-500/30 rounded-3xl blur-xl"></div>
            <div className="relative bg-spotify-elevated/50 backdrop-blur-sm rounded-3xl p-8 border border-spotify-green/30">
              <div className="text-center space-y-4">
                <Music className="w-20 h-20 text-spotify-green mx-auto" />
                <h3 className="text-2xl font-bold">Pure Music Experience</h3>
                <p className="text-spotify-lightgray">
                  Direct connection between artists and listeners, without any barriers or limitations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hall of Fame Section */}
      <div className="px-6 py-20 bg-gradient-to-r from-spotify-elevated via-spotify-base to-spotify-elevated">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-500 via-spotify-green to-yellow-500 bg-clip-text text-transparent">
              Hall of Fame
            </h2>
            <p className="text-xl text-spotify-lightgray max-w-2xl mx-auto">
              Meet the talented developers who brought Sonic Wave to life
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-500 to-spotify-green mx-auto mt-6"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {developers.map((dev, index) => (
              <Card key={dev.name} className="bg-spotify-elevated/50 border-spotify-green/30 hover:border-spotify-green/60 transition-all duration-300 hover:scale-105 group backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <div className={`absolute inset-0 ${dev.color} rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                    <Avatar className="w-24 h-24 relative border-4 border-spotify-green/50">
                      <AvatarImage src="" alt={dev.name} />
                      <AvatarFallback className={`${dev.color} text-white text-2xl font-bold`}>
                        {dev.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-2xl text-spotify-white group-hover:text-spotify-green transition-colors">
                    {dev.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-spotify-base/50 rounded-lg p-4 border-l-4 border-spotify-green">
                    <p className="text-spotify-lightgray italic text-center leading-relaxed">
                      "{dev.note}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-6 py-12 text-center bg-spotify-elevated">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 text-spotify-green">
            Join the Sonic Wave Community
          </h3>
          <p className="text-spotify-lightgray mb-6">
            Where music meets freedom, and artists connect with their true audience.
          </p>
          <div className="w-16 h-1 bg-spotify-green mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
