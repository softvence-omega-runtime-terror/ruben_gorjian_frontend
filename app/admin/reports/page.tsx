"use client";

import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  Instagram,
  Facebook,
  Linkedin,
  Clock
} from "lucide-react";
import { SiTiktok as Tiktok } from "react-icons/si";
import { Progress } from "@/components/ui/progress";

function ReportsContent() {
  const [stats, setStats] = useState({
    activeClients: 124,
    monthlyRevenue: 15420,
    totalPosts: 842,
    successfulPosts: 798,
    failedPosts: 44,
    cancellations: 3,
    platforms: {
      instagram: 420,
      facebook: 280,
      linkedin: 110,
      tiktok: 32
    }
  });

  const successRate = Math.round((stats.successfulPosts / stats.totalPosts) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Business Analytics</h1>
        <p className="text-slate-400">Comprehensive overview of Talexia's performance and client activity.</p>
      </div>

      {/* Top Level Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-lime-400/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">${stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-lime-400 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-lime-400/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Clients</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.activeClients}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-400/10 text-blue-400 border border-blue-400/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+8 new this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-lime-400/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white mt-1">{successRate}%</p>
              </div>
              <div className="p-3 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={successRate} className="h-1 bg-slate-800" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/60 transition-all hover:border-red-400/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Cancellations</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.cancellations}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-400 font-medium">
              <span>-2% lower than average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Posting Health */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-lime-400" />
              Posting Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end justify-around h-32 gap-2">
              {[65, 45, 78, 90, 85, 95, 80].map((height, i) => (
                <div key={i} className="w-full bg-slate-800 rounded-t-md relative group">
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-lime-400/50 group-hover:bg-lime-400 transition-all rounded-t-sm" 
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Scheduled</p>
                <p className="text-2xl font-bold text-white">{stats.totalPosts}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-400">{stats.failedPosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Distribution */}
        <Card className="border-slate-800 bg-slate-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-lime-400" />
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    <span>Instagram</span>
                  </div>
                  <span className="font-bold text-white">{stats.platforms.instagram} posts</span>
                </div>
                <Progress value={50} className="h-2 bg-slate-800" indicatorClassName="bg-pink-400" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Facebook className="h-4 w-4 text-blue-500" />
                    <span>Facebook</span>
                  </div>
                  <span className="font-bold text-white">{stats.platforms.facebook} posts</span>
                </div>
                <Progress value={33} className="h-2 bg-slate-800" indicatorClassName="bg-blue-500" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    <span>LinkedIn</span>
                  </div>
                  <span className="font-bold text-white">{stats.platforms.linkedin} posts</span>
                </div>
                <Progress value={13} className="h-2 bg-slate-800" indicatorClassName="bg-blue-400" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Tiktok className="h-4 w-4 text-white" />
                    <span>TikTok</span>
                  </div>
                  <span className="font-bold text-white">{stats.platforms.tiktok} posts</span>
                </div>
                <Progress value={4} className="h-2 bg-slate-800" indicatorClassName="bg-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-500" />
            Recent Issues & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-400/5 border border-red-400/10">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Post Failed for Client #293</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Instagram API returned: 'OAuth exception: Invalid token'. Client notified to reconnect.
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-2">
                    2 hours ago • Action required
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Suspense fallback={<div className="text-white">Loading analytics...</div>}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}
