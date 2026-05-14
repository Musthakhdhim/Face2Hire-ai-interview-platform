import { useEffect, type JSX } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Brain, Sparkles, Target, TrendingUp, CheckCircle2, ArrowRight,
  Users, BarChart, MessageSquare, Award, Clock, Globe, Zap, Shield, Upload,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { RootState } from '../store/store';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

interface Stat {
  value: string;
  label: string;
  icon: React.ElementType;
}

interface Benefit {
  text: string;
  icon: React.ElementType;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating: number;
}

export default function LandingPage(): JSX.Element {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (token && user) {
      const role = user.role?.toLowerCase();
      if (role === 'interviewee') navigate('/interviewee');
      else if (role === 'interviewer') navigate('/interviewer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [token, user, navigate]);

  const features: Feature[] = [
    {
      icon: Brain,
      title: 'AI Avatar Interviewer',
      description: 'Practice with our intelligent AI avatar that adapts to your responses',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: Target,
      title: 'CV-Based Questions',
      description: 'Get personalized questions tailored to your resume and experience',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: MessageSquare,
      title: 'Real-time Feedback',
      description: 'Receive instant, actionable feedback on your interview performance',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: BarChart,
      title: 'Progress Analytics',
      description: 'Track your improvement with detailed analytics and insights',
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  const stats: Stat[] = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '50K+', label: 'Interviews Completed', icon: CheckCircle2 },
    { value: '4.8/5', label: 'Average Rating', icon: Award },
    { value: '85%', label: 'Success Rate', icon: TrendingUp },
  ];

  const benefits: Benefit[] = [
    { text: 'Unlimited practice sessions', icon: Zap },
    { text: 'Multiple interview formats', icon: Globe },
    { text: 'Detailed performance reports', icon: BarChart },
    { text: '24/7 availability', icon: Clock },
    { text: 'Industry-standard questions', icon: Shield },
    { text: 'Personalized improvement tips', icon: Target },
  ];

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer at Google',
      text: 'InterviewAI helped me land my dream job! The AI feedback was incredibly accurate and helped me improve my weak areas.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager at Meta',
      text: 'The practice sessions felt like real interviews. I was so much more confident when the actual interview day came.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'Data Scientist at Amazon',
      text: 'Best investment I made in my career. The analytics feature showed me exactly what I needed to work on.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="size-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              InterviewAI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">How It Works</a>
            <a href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Login</Button></Link>
            <Link to="/signup"><Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">Get Started Free</Button></Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 size-64 bg-indigo-300/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-10 size-96 bg-purple-300/20 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200 mb-6"
            >
              <Sparkles className="size-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-600">Powered by Advanced AI</span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Ace Your Next Interview</span><br />
              <span className="text-gray-900">with AI</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Practice with our intelligent avatar, get personalized questions based on your CV,
              and receive actionable feedback to land your dream job
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-lg px-8 py-6">
                  Get Started Free <ArrowRight className="ml-2 size-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">Watch Demo</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <Icon className="size-8 mx-auto mb-3 text-indigo-600" />
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Our AI-powered platform provides comprehensive interview preparation tools</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className={`size-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                        <Icon className="size-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Get Started in 3 Simple Steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Your CV', description: 'Upload your resume and our AI will analyze your skills and experience', icon: Upload },
              { step: '02', title: 'Practice Interviews', description: 'Get personalized questions and practice with our AI avatar interviewer', icon: MessageSquare },
              { step: '03', title: 'Get Feedback', description: 'Receive detailed feedback and analytics to improve your performance', icon: TrendingUp },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative"
                >
                  <Card className="border-0 shadow-lg h-full">
                    <CardContent className="p-8">
                      <div className="text-6xl font-bold text-indigo-100 mb-4">{step.step}</div>
                      <Icon className="size-12 text-indigo-600 mb-4" />
                      <h3 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </CardContent>
                  </Card>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                      <ArrowRight className="size-8 text-indigo-300" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose InterviewAI?</h2>
              <p className="text-xl text-indigo-100 mb-8">Join thousands of job seekers who have successfully improved their interview skills</p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="size-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <Icon className="size-5" />
                      </div>
                      <span className="text-lg">{benefit.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 flex items-center justify-center">
                <Brain className="size-64 text-white/20" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-100 text-green-700 hover:bg-green-100">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Loved by Thousands</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">See what our users have to say about their experience</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Award key={i} className="size-5 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-3">
                      <img src={testimonial.avatar} alt={testimonial.name} className="size-12 rounded-full" />
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Ace Your Interviews?</h2>
          <p className="text-xl text-indigo-100 mb-8">Join over 10,000 job seekers who are already practicing with InterviewAI</p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6">
              Start Practicing for Free <ArrowRight className="ml-2 size-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Brain className="size-5 text-white" />
                </div>
                <span className="font-bold text-white">InterviewAI</span>
              </div>
              <p className="text-sm">AI-powered interview preparation platform helping job seekers land their dream jobs.</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 InterviewAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}