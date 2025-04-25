import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { aiApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle, ArrowRight, Pencil, Zap, Lightbulb, BarChart, MessageSquare } from 'lucide-react';

interface MessageOptimizerProps {
  initialMessage?: string;
  onOptimized?: (optimizedMessage: string) => void;
}

export function MessageOptimizer({ initialMessage = '', onOptimized }: MessageOptimizerProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState(initialMessage);
  const [channel, setChannel] = useState('SMS');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('');
  const [goal, setGoal] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('optimized');

  const optimize = useMutation({
    mutationFn: () => aiApi.optimizeMessage({
      message,
      channel,
      audience: audience || undefined,
      tone: tone || undefined,
      goal: goal || undefined
    }),
    onSuccess: (data) => {
      toast({
        title: 'Message Optimized!',
        description: 'AI has successfully optimized your message',
      });
      setIsDialogOpen(false);
      if (onOptimized) {
        onOptimized(data.optimizedMessage);
      }
    },
    onError: (error) => {
      toast({
        title: 'Optimization Failed',
        description: 'There was an error optimizing your message.',
        variant: 'destructive',
      });
      console.error('Optimization error:', error);
    }
  });

  const handleOptimize = () => {
    if (!message.trim()) {
      toast({
        title: 'Missing Content',
        description: 'Please enter a message to optimize.',
        variant: 'destructive',
      });
      return;
    }
    optimize.mutate();
  };

  const renderSuggestions = () => {
    if (!optimize.data?.suggestions || optimize.data.suggestions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No suggestions available yet. Optimize your message to get AI recommendations.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {optimize.data.suggestions.map((suggestion, index) => (
          <Card key={index}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium flex items-center">
                {suggestion.type === 'Personalization' && <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />}
                {suggestion.type === 'Length' && <Pencil className="h-4 w-4 mr-2 text-purple-500" />}
                {suggestion.type === 'Call to Action' && <ArrowRight className="h-4 w-4 mr-2 text-green-500" />}
                {suggestion.type === 'Engagement' && <Zap className="h-4 w-4 mr-2 text-amber-500" />}
                {suggestion.type === 'Security' && <CheckCircle className="h-4 w-4 mr-2 text-red-500" />}
                {suggestion.type}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-sm text-gray-700">{suggestion.description}</p>
              {suggestion.before && suggestion.after && (
                <div className="mt-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded-md">
                    <p className="text-gray-500">Before:</p>
                    <p className="mt-1">{suggestion.before}</p>
                  </div>
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="bg-blue-50 p-2 rounded-md">
                    <p className="text-blue-500">After:</p>
                    <p className="mt-1">{suggestion.after}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStats = () => {
    if (!optimize.data?.stats) {
      return (
        <div className="text-center py-8 text-gray-500">
          <BarChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No statistics available yet. Optimize your message to get performance metrics.</p>
        </div>
      );
    }

    const { clarity, engagement, persuasiveness, overall } = optimize.data.stats;

    return (
      <div className="space-y-6 p-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Clarity</Label>
            <span className="text-sm font-medium">{Math.round(clarity * 100)}%</span>
          </div>
          <Progress value={clarity * 100} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Engagement</Label>
            <span className="text-sm font-medium">{Math.round(engagement * 100)}%</span>
          </div>
          <Progress value={engagement * 100} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Persuasiveness</Label>
            <span className="text-sm font-medium">{Math.round(persuasiveness * 100)}%</span>
          </div>
          <Progress value={persuasiveness * 100} className="h-2" />
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="font-semibold">Overall Score</Label>
            <span className="text-sm font-semibold">{Math.round(overall * 100)}%</span>
          </div>
          <Progress 
            value={overall * 100} 
            className={`h-3 ${overall >= 0.9 ? 'bg-green-100' : overall >= 0.7 ? 'bg-blue-100' : 'bg-amber-100'}`} 
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => setIsDialogOpen(true)}
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span>AI Optimize</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>AI Message Optimizer</DialogTitle>
            <DialogDescription>
              Let AI analyze and enhance your message for better engagement and performance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                rows={4}
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="channel">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="RCS">RCS</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger id="audience">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="youth">Youth (18-25)</SelectItem>
                    <SelectItem value="professional">Professionals</SelectItem>
                    <SelectItem value="senior">Seniors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tone">Message Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal">Message Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inform">Inform</SelectItem>
                    <SelectItem value="persuade">Persuade</SelectItem>
                    <SelectItem value="engage">Engage</SelectItem>
                    <SelectItem value="convert">Convert</SelectItem>
                    <SelectItem value="remind">Remind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {optimize.data && (
            <Tabs defaultValue="optimized" value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="optimized">Optimized</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="optimized" className="p-4 bg-gray-50 rounded-md mt-2">
                <p className="text-xs text-gray-500 mb-1">AI Optimized Message:</p>
                <div className="bg-white p-3 rounded border border-gray-200">
                  {optimize.data.optimizedMessage}
                </div>
              </TabsContent>
              <TabsContent value="suggestions" className="mt-2">
                {renderSuggestions()}
              </TabsContent>
              <TabsContent value="stats" className="mt-2">
                {renderStats()}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleOptimize}
              disabled={optimize.isPending || !message.trim()}
            >
              {optimize.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : optimize.data ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Re-Optimize
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}