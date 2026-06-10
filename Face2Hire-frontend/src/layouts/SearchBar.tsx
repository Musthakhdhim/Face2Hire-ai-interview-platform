import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  label: string;
  path: string;
  keywords?: string[];
}

interface SearchBarProps {
  role: string;
}

const getSearchItems = (role: string): SearchItem[] => {
  const common = [
    { label: 'Settings', path: `/${role}/settings`, keywords: ['settings', 'profile', 'account'] },
  ];

  if (role === 'interviewee') {
    return [
      { label: 'Dashboard', path: '/interviewee', keywords: ['home', 'dashboard'] },
      { label: 'Browse Jobs', path: '/interviewee/jobs', keywords: ['jobs', 'browse'] },
      { label: 'Upload CV', path: '/interviewee/upload-cv', keywords: ['resume', 'cv', 'upload'] },
      { label: 'My Applications', path: '/interviewee/applications', keywords: ['applications', 'applied'] },
      { label: 'Upcoming Interviews', path: '/interviewee/upcoming', keywords: ['upcoming', 'scheduled'] },
      { label: 'History', path: '/interviewee/history', keywords: ['history', 'past'] },
      { label: 'Analytics', path: '/interviewee/analytics', keywords: ['analytics', 'stats'] },
      ...common,
    ];
  } else if (role === 'interviewer') {
    return [
      { label: 'Dashboard', path: '/interviewer', keywords: ['home', 'dashboard'] },
      { label: 'My Jobs', path: '/interviewer/jobs', keywords: ['jobs', 'listings'] },
      { label: 'Applications', path: '/interviewer/applications', keywords: ['applications', 'candidates'] },
      { label: 'Schedule Interview', path: '/interviewer/schedule', keywords: ['schedule', 'interview'] },
      { label: 'Scheduled Interviews', path: '/interviewer/scheduled', keywords: ['scheduled', 'upcoming'] },
      ...common,
    ];
  } else if (role === 'admin') {
    return [
      { label: 'Dashboard', path: '/admin', keywords: ['home', 'dashboard'] },
      { label: 'Users', path: '/admin/users', keywords: ['users', 'accounts'] },
      { label: 'Interviews', path: '/admin/interviews', keywords: ['interviews', 'sessions'] },
      { label: 'Jobs', path: '/admin/jobs', keywords: ['jobs', 'postings'] },
      { label: 'Activities', path: '/admin/activities', keywords: ['activities', 'logs'] },
      { label: 'Reports', path: '/admin/reports', keywords: ['reports', 'analytics'] },
      { label: 'Send Email', path: '/admin/email', keywords: ['email', 'promotion'] },
      { label: 'Badges', path: '/admin/badges', keywords: ['badges', 'achievements'] },
      ...common,
    ];
  }
  return [];
};

export default function SearchBar({ role }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchItems = getSearchItems(role);

  useEffect(() => {
    if (query.trim() === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setIsOpen(false);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const matched = searchItems.filter(item =>
      item.label.toLowerCase().includes(lowerQuery) ||
      (item.keywords && item.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
    );
    setResults(matched.slice(0, 8));
    setIsOpen(matched.length > 0);
  }, [query, searchItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string) => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
    setTimeout(() => {
      navigate(path);
    }, 50);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-8 bg-gray-50 border-gray-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden">
          <ul>
            {results.map((item) => (
              <li
                key={item.path}
                onClick={() => handleSelect(item.path)}
                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700"
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}