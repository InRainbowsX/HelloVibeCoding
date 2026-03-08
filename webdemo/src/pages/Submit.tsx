import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Layout, CheckCircle2, ArrowRight, ArrowLeft, Upload, Info } from 'lucide-react';
import { cn } from '../utils';

export const Submit = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: '',
    description: ''
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="space-y-12">
        {/* Progress Bar */}
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-brand-ink/5 z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-ink transition-all duration-500 z-0" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 border-4",
                step >= i ? "bg-brand-ink text-brand-bg border-brand-ink" : "bg-white text-brand-ink/20 border-brand-ink/5"
              )}
            >
              {step > i ? <CheckCircle2 className="h-5 w-5" /> : i}
            </div>
          ))}
        </div>

        <div className="bg-white border border-brand-line/5 rounded-3xl p-8 md:p-12 shadow-xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">基本信息</h2>
                  <p className="text-brand-ink/50">告诉我们你想要提交的产品名称与网址。</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">产品名称</label>
                    <input
                      type="text"
                      placeholder="例如: Linear"
                      className="w-full p-4 bg-brand-ink/5 border-none rounded-2xl focus:ring-2 focus:ring-brand-ink/10 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">官方网址</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ink/20" />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        className="w-full p-4 pl-12 bg-brand-ink/5 border-none rounded-2xl focus:ring-2 focus:ring-brand-ink/10 outline-none"
                        value={formData.url}
                        onChange={e => setFormData({...formData, url: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!formData.name || !formData.url}
                  className="w-full py-4 bg-brand-ink text-brand-bg rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30"
                >
                  下一步 <ArrowRight className="h-5 w-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">分类与描述</h2>
                  <p className="text-brand-ink/50">帮助我们更好地理解该产品的定位。</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">产品分类</label>
                    <select
                      className="w-full p-4 bg-brand-ink/5 border-none rounded-2xl focus:ring-2 focus:ring-brand-ink/10 outline-none appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">选择分类</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Collaboration">Collaboration</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-ink/40">一句话描述</label>
                    <textarea
                      placeholder="简短介绍该产品的核心价值..."
                      className="w-full p-4 bg-brand-ink/5 border-none rounded-2xl focus:ring-2 focus:ring-brand-ink/10 outline-none h-32 resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 py-4 bg-brand-ink/5 text-brand-ink rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-ink/10 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" /> 返回
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!formData.category || !formData.description}
                    className="flex-[2] py-4 bg-brand-ink text-brand-bg rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-30"
                  >
                    下一步 <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif italic">提交成功！</h2>
                  <p className="text-brand-ink/50">我们的分析师将会在 24 小时内完成审核并开始拆解。</p>
                </div>
                <div className="p-6 bg-brand-ink/5 rounded-3xl text-left space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-brand-ink/30 mt-0.5" />
                    <p className="text-xs text-brand-ink/60 leading-relaxed">
                      你可以关注我们的 Twitter 获取最新的拆解动态，或者加入我们的 Discord 社区参与讨论。
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full py-4 bg-brand-ink text-brand-bg rounded-2xl font-bold hover:opacity-90 transition-opacity"
                >
                  返回首页
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
