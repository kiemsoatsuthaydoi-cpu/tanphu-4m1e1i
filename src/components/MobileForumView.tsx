import React, { useState, useRef, useEffect } from "react";
import { 
  ForumTopic, 
  ForumReply, 
  ForumTopicCategory, 
  ForumTopicStatus, 
  User, 
  UserRole 
} from "../types";
import { resolveSenderInfo } from "../utils/userResolver";
import { 
  Search, 
  Pin, 
  MessageSquare, 
  Plus, 
  ArrowLeft, 
  Send,
  Clock,
  User as UserIcon,
  MessageCircle,
  Home,
  ArrowUp
} from "lucide-react";
import { T } from "./TranslateText";
import { MentionTextArea, MentionInput } from "./MentionTextArea";

interface MobileForumViewProps {
  topics: ForumTopic[];
  replies: ForumReply[];
  currentUser: User | null;
  users?: User[];
  onAddForumTopic?: (title: string, description: string, category: ForumTopicCategory) => void;
  onAddForumReply?: (topicId: string, message: string) => void;
  onUpdateForumTopicStatus?: (topicId: string, status: ForumTopicStatus) => void;
  onToggleForumTopicPin?: (topicId: string) => void;
  theme: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    lightBg: string;
    lightText: string;
  };
  onGoHome?: () => void;
}

export default function MobileForumView({
  topics,
  replies,
  currentUser,
  users = [],
  onAddForumTopic,
  onAddForumReply,
  onUpdateForumTopicStatus,
  onToggleForumTopicPin,
  theme,
  onGoHome
}: MobileForumViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<ForumTopicCategory>("Góp ý chức năng");
  const [replyMessage, setReplyMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [forumScrollTop, setForumScrollTop] = useState(0);

  const forumScrollRef = useRef<HTMLDivElement>(null);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  const topicReplies = replies
    .filter(r => r.topicId === selectedTopicId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  useEffect(() => {
    if (selectedTopicId) {
      repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopicId, topicReplies.length]);

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    if (onAddForumTopic) {
      onAddForumTopic(newTitle, newDesc, newCategory);
    }
    setNewTitle("");
    setNewDesc("");
    setNewCategory("Góp ý chức năng");
    setIsCreatingTopic(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTopicId) return;
    if (onAddForumReply) {
      onAddForumReply(selectedTopicId, replyMessage);
    }
    setReplyMessage("");
  };

  const getStatusLabel = (status: ForumTopicStatus) => {
    switch (status) {
      case "OPEN": return "Mới";
      case "PROCESSING": return "Đang xử lý";
      case "RESOLVED": return "Đã giải quyết";
      default: return status;
    }
  };

  const getStatusColor = (status: ForumTopicStatus) => {
    switch (status) {
      case "OPEN": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PROCESSING": return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const filteredTopics = topics
    .filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "ALL" || t.category === categoryFilter;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const categories: { value: string; label: string }[] = [
    { value: "ALL", label: "Tất cả" },
    { value: "Góp ý chức năng", label: "Góp ý chức năng" },
    { value: "Cải tiến 4M1E", label: "Cải tiến 4M1E" },
    { value: "Kiến nghị khác", label: "Kiến nghị khác" }
  ];

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden select-none">
      {/* Search and Category Filter Header */}
      <div className="bg-white border-b border-slate-200 p-3 shrink-0 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm chủ đề thảo luận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs outline-none placeholder:text-slate-400 text-slate-700 font-medium"
          />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold border whitespace-nowrap cursor-pointer transition-colors ${
                categoryFilter === cat.value
                  ? `${theme.bg} text-white border-transparent`
                  : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <T>{cat.label}</T>
            </button>
          ))}
        </div>
      </div>

      {/* Topics List Container */}
      <div 
        ref={forumScrollRef}
        onScroll={(e) => setForumScrollTop(e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-20 forum-scroll-container"
      >
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-xs font-semibold">
            <T>Chưa có chủ đề nào trong chuyên mục này.</T>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const replyCount = replies.filter(r => r.topicId === topic.id).length;
            return (
              <div
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`bg-white p-3 rounded-lg border transition-all cursor-pointer relative ${
                  topic.isPinned 
                    ? "border-amber-300 bg-amber-50/10 hover:border-amber-400" 
                    : "border-slate-200 hover:border-slate-350"
                }`}
              >
                {/* Topic Header: Pin and Status */}
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {topic.isPinned && (
                      <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    <span className="text-[9px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      <T>{topic.category}</T>
                    </span>
                  </div>
                  <span className={`text-[8px] font-extrabold border px-1.5 py-0.5 rounded leading-none shrink-0 ${getStatusColor(topic.status)}`}>
                    <T>{getStatusLabel(topic.status)}</T>
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-extrabold text-[11.5px] text-slate-850 leading-snug line-clamp-2 mb-1">
                  <span translate="no" className="notranslate">
                    {topic.title}
                  </span>
                </h4>

                {/* Description snippet */}
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
                  <span translate="no" className="notranslate">
                    {topic.description}
                  </span>
                </p>

                {/* Footer metrics */}
                <div className="flex justify-between items-center text-[8.5px] text-slate-400 font-bold border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <UserIcon className="w-2.5 h-2.5 text-slate-400" />
                      <span translate="no" className="notranslate">{topic.creatorName}</span>
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span translate="no" className="notranslate">{topic.timestamp}</span>
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] text-blue-600 font-black">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-50/50" />
                    <span translate="no" className="notranslate">{replyCount}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) to create topic - positioned next to HOME button */}
      {!isCreatingTopic && !selectedTopicId && (
        <button
          onClick={() => setIsCreatingTopic(true)}
          className={`absolute bottom-20 right-18 w-10 h-10 rounded-xl ${theme.bg} text-white flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer z-20`}
          title="Tạo chủ đề thảo luận"
        >
          <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Floating HOME Button on Forum Page */}
      {!isCreatingTopic && !selectedTopicId && (
        <button
          id="float-home-forum"
          type="button"
          onClick={() => onGoHome && onGoHome()}
          className="absolute bottom-20 right-5 w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-xl transition-all z-20 cursor-pointer border-none"
          title="Trở về Trang Home"
        >
          <Home className="w-[18px] h-[18px] text-white stroke-[2.2px]" />
        </button>
      )}

      {/* Floating Scroll to Top Button on Forum Page */}
      {!isCreatingTopic && !selectedTopicId && forumScrollTop > 100 && (
        <button
          type="button"
          onClick={() => forumScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="absolute bottom-32 right-5 w-10 h-10 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5 text-white stroke-[2.5px]" />
        </button>
      )}

      {/* Slide-over Detail View */}
      {selectedTopic && (
        <div className="absolute inset-0 bg-white z-40 flex flex-col animate-slideIn">
          {/* Slide-over Header */}
          <div className={`px-3 py-2.5 text-white flex items-center gap-2 shrink-0 ${theme.bg}`}>
            <button
              onClick={() => setSelectedTopicId(null)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors border-none bg-transparent cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-[11px] uppercase tracking-wide truncate">
                <T>Chi tiết trao đổi</T>
              </h3>
            </div>
          </div>

          {/* Slide-over Content Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
            {/* Main Topic Information Card */}
            <div className="bg-white border-b border-slate-200 p-4 space-y-3 shrink-0 select-text">
              <div className="flex justify-between items-start gap-2">
                <span className="text-[9px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                  <T>{selectedTopic.category}</T>
                </span>
                <span className={`text-[8.5px] font-extrabold border px-2 py-0.5 rounded leading-none shrink-0 ${getStatusColor(selectedTopic.status)}`}>
                  <T>{getStatusLabel(selectedTopic.status)}</T>
                </span>
              </div>

              <h2 className="font-black text-xs text-slate-850 leading-snug">
                <span translate="no" className="notranslate">
                  {selectedTopic.title}
                </span>
              </h2>

              <p className="text-[10.5px] leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                <span translate="no" className="notranslate">
                  {selectedTopic.description}
                </span>
              </p>

              {/* Author & Meta */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 font-bold">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span translate="no" className="notranslate">{selectedTopic.creatorName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span translate="no" className="notranslate">{selectedTopic.timestamp}</span>
                </span>
              </div>

              {/* Admin Administrative controls (Pinning and Status Update) */}
              {isAdmin && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mt-2 space-y-2 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 uppercase"><T>Ghim chủ đề</T></span>
                    <button
                      onClick={() => onToggleForumTopicPin && onToggleForumTopicPin(selectedTopic.id)}
                      className={`px-2 py-1 rounded text-[8.5px] font-extrabold border cursor-pointer transition-colors ${
                        selectedTopic.isPinned
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <T>{selectedTopic.isPinned ? "Bỏ Ghim 📌" : "Ghim Lên Đầu"}</T>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 uppercase"><T>Trạng thái</T></span>
                    <div className="flex gap-1">
                      {(["OPEN", "PROCESSING", "RESOLVED"] as ForumTopicStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => onUpdateForumTopicStatus && onUpdateForumTopicStatus(selectedTopic.id, status)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border transition-all cursor-pointer ${
                            selectedTopic.status === status
                              ? "bg-slate-800 text-white border-slate-950 shadow-xs scale-102"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <T>{getStatusLabel(status)}</T>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Discussion Header */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-100 shrink-0 select-none">
              <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-450" />
                <T>Ý kiến trao đổi</T>
                <span translate="no" className="notranslate">({topicReplies.length})</span>
              </span>
            </div>

            {/* Replies List */}
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto select-text">
              {topicReplies.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[10px] font-semibold bg-white rounded-lg border border-slate-200 select-none">
                  <T>Chưa có phản hồi nào cho chủ đề này.</T>
                </div>
              ) : (
                topicReplies.map((reply) => {
                  const resolvedSender = resolveSenderInfo(users, reply.senderPhone, reply.senderName, reply.senderRole);
                  return (
                    <div
                      key={reply.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-3xs"
                    >
                      <div className="flex justify-between items-center text-[8.5px] text-slate-450 font-extrabold border-b border-slate-100 pb-1">
                        <span className="text-slate-850 notranslate" translate="no">
                          {resolvedSender.fullName} ({resolvedSender.position || (resolvedSender.role === UserRole.ADMIN ? "BQT" : "Nhân viên")})
                        </span>
                      <span className="text-slate-400 notranslate" translate="no">
                        {reply.timestamp}
                      </span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-700 font-medium">
                      <span translate="no" className="notranslate">
                        {reply.message}
                      </span>
                    </p>
                  </div>
                );
              })
              )}
              <div ref={repliesEndRef} />
            </div>

            {/* Reply Input Box */}
            <form
              onSubmit={handleSendReply}
              className="p-2 border-t border-slate-200 bg-white flex gap-1.5 items-center shrink-0 select-none"
            >
              <MentionInput
                users={users}
                placeholder="Phản hồi ý kiến của bạn..."
                value={replyMessage}
                onChange={setReplyMessage}
                className="flex-1 bg-slate-150 border-none outline-none pl-3 pr-2 py-2 rounded-lg text-xs font-medium placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!replyMessage.trim()}
                className={`p-2 rounded-lg ${theme.bg} hover:opacity-90 active:scale-95 text-white disabled:bg-slate-300 disabled:opacity-50 transition-all border-none cursor-pointer flex items-center justify-center shrink-0`}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Topic Drawer/Modal */}
      {isCreatingTopic && (
        <div 
          onClick={() => setIsCreatingTopic(false)}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end justify-center select-none animate-fadeIn cursor-pointer"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateTopic}
            className="bg-white rounded-t-xl w-full max-h-[85%] flex flex-col shadow-2xl border-t border-slate-100 animate-slideUp cursor-default"
          >
            {/* Header */}
            <div className={`px-4 py-3 text-white flex justify-between items-center shrink-0 rounded-t-xl ${theme.bg}`}>
              <h3 className="font-extrabold text-[11px] uppercase tracking-wider">
                <T>Tạo chủ đề trao đổi</T>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingTopic(false)}
                className="text-white hover:bg-white/10 p-1 rounded-md cursor-pointer border-none bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                  <T>Chuyên mục</T>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Góp ý chức năng", "Cải tiến 4M1E", "Kiến nghị khác"] as ForumTopicCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`py-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        newCategory === cat
                          ? `${theme.bg} text-white border-transparent`
                          : "bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <T>{cat}</T>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                  <T>Tiêu đề</T>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tiêu đề thảo luận rõ ràng, ngắn gọn..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                  <T>Nội dung chi tiết</T>
                </label>
                <MentionTextArea
                  users={users}
                  placeholder="Ghi rõ ý kiến, đề xuất chi tiết hoặc phản hồi đến BQT..."
                  value={newDesc}
                  onChange={setNewDesc}
                  className="w-full bg-slate-100 border border-slate-250 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-slate-50 border-t border-slate-150 p-3 flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreatingTopic(false)}
                className="flex-1 py-2.5 text-center text-slate-650 border border-slate-250 rounded-lg text-[11px] font-black hover:bg-slate-100 cursor-pointer bg-white"
              >
                <T>QUAY LẠI</T>
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || !newDesc.trim()}
                className={`flex-1 py-2.5 text-center text-white rounded-lg text-[11px] font-black ${theme.bg} disabled:bg-slate-300 disabled:opacity-50 cursor-pointer border-none`}
              >
                <T>TẠO CHỦ ĐỀ</T>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
