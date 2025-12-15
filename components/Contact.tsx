/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { EnvelopeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { AutoResizeTextarea } from './AutoResizeTextarea';

export const Contact: React.FC = () => {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 pt-44 pb-24 animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-bold text-white mb-6">Get in touch</h1>
                <p className="text-zinc-400 text-lg">
                    Have a question about a listing? Need help valuating your asset? Our team is here to help.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-zinc-900 rounded-lg">
                            <EnvelopeIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Email Us</h3>
                            <p className="text-zinc-500 text-sm">support@ida.marketplace</p>
                            <p className="text-zinc-500 text-sm">partnerships@ida.marketplace</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-zinc-900 rounded-lg">
                            <MapPinIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Headquarters</h3>
                            <p className="text-zinc-500 text-sm">Samakhushi, Kathmandu, Nepal</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
                            <input type="text" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="Your name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                            <input type="email" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500" placeholder="you@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Message</label>
                            <AutoResizeTextarea className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 min-h-[128px]" placeholder="How can we help?" />
                        </div>
                        <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
