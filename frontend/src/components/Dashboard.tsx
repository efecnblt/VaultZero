import { useState, useEffect } from 'react';
import { Search, Plus, Lock, LogOut, Grid, List, Users, Briefcase, DollarSign, Folder, Download } from 'lucide-react';
import { Credential, Category } from '../types';
import * as App from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import CredentialCard from './CredentialCard';
import AddModal from './AddModal';
import ImportModal from './ImportModal';

const Dashboard: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editCredential, setEditCredential] = useState<Credential | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();

    // Listen for credentials updates from browser extension
    EventsOn('credentials-updated', () => {
      loadCredentials();
    });
  }, []);

  useEffect(() => {
    filterCredentials();
  }, [credentials, selectedCategory, searchQuery]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const creds = await App.GetAllCredentials();
      setCredentials(creds || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCredentials = () => {
    let filtered = credentials;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((cred) => cred.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cred) =>
          cred.serviceName.toLowerCase().includes(query) ||
          cred.username.toLowerCase().includes(query) ||
          cred.url.toLowerCase().includes(query)
      );
    }

    setFilteredCredentials(filtered);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      try {
        await App.DeleteCredential(id);
        await loadCredentials();
      } catch (error) {
        console.error('Failed to delete credential:', error);
        alert('Failed to delete credential');
      }
    }
  };

  const handleEdit = (credential: Credential) => {
    setEditCredential(credential);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditCredential(null);
  };

  const handleModalSuccess = () => {
    loadCredentials();
  };

  const handleLockVault = () => {
    if (window.confirm('Are you sure you want to lock the vault?')) {
      App.LockVault();
      window.location.reload();
    }
  };

  const getCategoryIcon = (category: Category) => {
    const icons = {
      All: Folder,
      Social: Users,
      Work: Briefcase,
      Finance: DollarSign,
      Other: Folder,
    };
    return icons[category];
  };

  const categories: Category[] = ['All', 'Social', 'Work', 'Finance', 'Other'];

  const getCategoryCount = (category: Category) => {
    if (category === 'All') return credentials.length;
    return credentials.filter((cred) => cred.category === category).length;
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">VaultZero</h1>
              <p className="text-xs text-slate-400">Password Manager</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
            Categories
          </div>
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            const isActive = selectedCategory === category;
            const count = getCategoryCount(category);

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Lock Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLockVault}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Lock Vault</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700 p-6">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search credentials..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-slate-900/50 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Grid view"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
              title="Import from browser"
            >
              <Download className="w-5 h-5" />
              Import
            </button>

            {/* Add Button */}
            <button
              onClick={() => {
                setEditCredential(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-600/30"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>
        </header>

        {/* Credentials Grid/List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400 text-lg">Loading credentials...</div>
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-300 mb-2">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No credentials found'
                  : 'No credentials yet'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'Get started by adding your first credential to the vault.'}
              </p>
              {!searchQuery && selectedCategory === 'All' && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Credential
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4 max-w-4xl mx-auto'
              }
            >
              {filteredCredentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AddModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editCredential={editCredential}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default Dashboard;
