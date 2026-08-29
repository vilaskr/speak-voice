import React from 'react';
import { Lock } from 'lucide-react';

interface FooterProps {
  onAdminRouteClick?: () => void;
  onOpenSetupModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onAdminRouteClick, onOpenSetupModal }) => {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-3 flex-shrink-0">
      <div className="flex gap-3 sm:gap-4 items-center flex-wrap">
        <span>&copy; 2026 SpeakSafe Platform</span>
        <span>&bull;</span>
        <span className="text-slate-500 font-medium">Secure Infrastructure</span>
        <span>&bull;</span>
        <span className="text-emerald-600 font-semibold">System Status: Active</span>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <span>
          Built by{' '}
          <a
            href="https://github.com/vilaskr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Vilas K R
          </a>
        </span>
        <div className="flex gap-3 border-l border-slate-200 pl-4 items-center">
          <a
            href="https://instagram.com/vilaskr_"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            @vilaskr_
          </a>
          <a
            href="https://github.com/vilaskr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            @vilaskr
          </a>
          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="hover:text-indigo-600 transition-colors cursor-pointer text-slate-400 ml-1"
              title="Supabase Database SQL Instructions"
            >
              SQL Setup
            </button>
          )}
          {onAdminRouteClick && (
            <button
              onClick={onAdminRouteClick}
              className="hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1 text-slate-400"
              title="Navigate to Admin Console (/adminpanel)"
            >
              <Lock className="w-3 h-3" />
              <span>/adminpanel</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

