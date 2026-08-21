import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ForumPost, ForumComment } from '../lib/supabase';
import { MessageCircle, Image as ImageIcon, Send, Calendar } from 'lucide-react';
import { ActivityFeed } from '../components/ActivityFeed';

const categories = [
  'Meditace',
  'Jóga & tělo',
  'Energie',
  'Osobní růst',
];

export const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState(categories[0]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        author:users!forum_posts_author_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data } = await query;

    if (data) {
      setPosts(data as any);
    }
    setLoading(false);
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from('forum_comments')
      .select(`
        *,
        author:users!forum_comments_author_id_fkey(id, name, email)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as any);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostContent.trim()) return;

    const { data: postData, error } = await supabase
      .from('forum_posts')
      .insert([
        {
          author_id: user.id,
          category: newPostCategory,
          content: newPostContent,
          title: newPostContent.substring(0, 50) + (newPostContent.length > 50 ? '...' : '')
        },
      ])
      .select()
      .single();

    if (!error && postData) {
      await supabase
        .from('activities')
        .insert({
          author_id: user.id,
          activity_type: 'forum_post',
          forum_post_id: postData.id,
          category: newPostCategory
        });

      setNewPostContent('');
      setShowNewPostForm(false);
      loadPosts();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost || !newComment.trim()) return;

    const { error } = await supabase
      .from('forum_comments')
      .insert([
        {
          post_id: selectedPost.id,
          author_id: user.id,
          content: newComment,
        },
      ]);

    if (!error) {
      setNewComment('');
      loadComments(selectedPost.id);
    }
  };

  const handlePostClick = (post: ForumPost) => {
    setSelectedPost(post);
    loadComments(post.id);
  };

  if (selectedPost) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#191b1f' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <button
            onClick={() => setSelectedPost(null)}
            className="mb-4 sm:mb-6 font-medium hover:opacity-80 transition-opacity text-sm sm:text-base"
            style={{ color: '#A2B6B9' }}
          >
            ← Zpět na příspěvky
          </button>

          <div className="rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: '#2c2e33' }}>
            <div className="flex items-start gap-3 sm:gap-4 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A2B6B9' }}>
                <span className="text-sm sm:text-base font-semibold" style={{ color: '#191b1f' }}>
                  {selectedPost.author?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <span className="font-semibold text-white text-sm sm:text-base truncate">
                    {selectedPost.author?.name}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">
                    {new Date(selectedPost.created_at).toLocaleDateString('cs-CZ')}
                  </span>
                </div>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}>
                  {selectedPost.category}
                </span>
              </div>
            </div>

            <p className="text-gray-200 whitespace-pre-wrap text-sm sm:text-base">{selectedPost.content}</p>

            {selectedPost.image_url && (
              <img
                src={selectedPost.image_url}
                alt="Post"
                className="mt-4 rounded-lg max-h-96 object-cover"
              />
            )}
          </div>

          <div className="rounded-xl shadow-sm p-4 sm:p-6" style={{ backgroundColor: '#2c2e33' }}>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
              Komentáře ({comments.length})
            </h3>

            <form onSubmit={handleAddComment} className="mb-4 sm:mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Přidejte komentář..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg focus:ring-2 outline-none resize-none"
                style={{ backgroundColor: '#191b1f', color: '#fff', border: '1px solid #A2B6B9' }}
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="mt-2 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Odeslat komentář</span>
                <span className="sm:hidden">Odeslat</span>
              </button>
            </form>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A2B6B9' }}>
                    <span className="text-sm font-semibold" style={{ color: '#191b1f' }}>
                      {comment.author?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg p-3" style={{ backgroundColor: '#191b1f' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">
                        {comment.author?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  Zatím žádné komentáře. Buďte první!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#191b1f' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Komunita</h1>
            <p className="text-sm sm:text-base text-gray-300">
              Sdílejte své zkušenosti a spojte se s ostatními
            </p>
          </div>
          <button
            onClick={() => setShowNewPostForm(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-medium whitespace-nowrap"
            style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Nový příspěvek</span>
            <span className="sm:hidden">Nový</span>
          </button>
        </div>

        <div className="mb-8">
          <ActivityFeed />
        </div>

        {showNewPostForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="rounded-xl max-w-2xl w-full p-6" style={{ backgroundColor: '#2c2e33' }}>
              <h2 className="text-2xl font-bold text-white mb-4">
                Vytvořit příspěvek
              </h2>
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 outline-none"
                    style={{ backgroundColor: '#191b1f', color: '#fff', border: '1px solid #A2B6B9' }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Obsah
                  </label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Sdílejte své myšlenky..."
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 outline-none resize-none"
                    style={{ backgroundColor: '#191b1f', color: '#fff', border: '1px solid #A2B6B9' }}
                    rows={6}
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-6 py-2 rounded-lg hover:bg-opacity-80 transition-all font-medium"
                    style={{ backgroundColor: '#191b1f', color: '#fff', border: '1px solid #A2B6B9' }}
                  >
                    Zrušit
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg hover:opacity-90 transition-all font-medium"
                    style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}
                  >
                    Zveřejnit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all font-medium whitespace-nowrap flex-shrink-0"
            style={{
              backgroundColor: selectedCategory === null ? '#A2B6B9' : '#2c2e33',
              color: selectedCategory === null ? '#191b1f' : '#fff'
            }}
          >
            Všechny
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-all font-medium whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor: selectedCategory === category ? '#A2B6B9' : '#2c2e33',
                color: selectedCategory === category ? '#191b1f' : '#fff'
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl p-6 animate-pulse" style={{ backgroundColor: '#2c2e33' }}>
                <div className="h-6 rounded w-1/4 mb-4" style={{ backgroundColor: '#191b1f' }} />
                <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#191b1f' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer"
                style={{ backgroundColor: '#2c2e33' }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#A2B6B9' }}>
                    <span className="text-sm sm:text-base font-semibold" style={{ color: '#191b1f' }}>
                      {post.author?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                      <span className="font-bold text-white text-base sm:text-lg truncate">
                        {post.author?.name}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: '#A2B6B9', color: '#191b1f' }}>
                        {post.category}
                      </span>
                    </div>
                    <p className="text-gray-200 line-clamp-3 text-sm sm:text-base">{post.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12 rounded-xl" style={{ backgroundColor: '#2c2e33' }}>
                <MessageCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#A2B6B9' }} />
                <p className="text-gray-300">
                  {selectedCategory
                    ? 'V této kategorii zatím nejsou žádné příspěvky'
                    : 'Zatím zde nejsou žádné příspěvky. Buďte první!'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
