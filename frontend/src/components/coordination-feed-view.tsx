import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Plus,
  Tag,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Lightbulb,
  Heart,
  Flame,
  MessageCircle,
  Building2,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Check,
  CheckCheck,
} from "lucide-react";
import { feedAPI, categoriesAPI, type FeedMessage } from "@/api/real";
import { useAuth } from "@/context/auth";
import { useOrganization } from "@/context/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CoordinationFeedViewProps {
  variant: "coordinator" | "admin";
}

const COMMON_EMOJIS = [
  { emoji: "👍", label: "Agree / Need this" },
  { emoji: "💡", label: "Great idea" },
  { emoji: "🚨", label: "Urgent" },
  { emoji: "❤️", label: "Support" },
];

const SUGGESTED_UNITS = ["units", "boxes", "kits", "kg", "liters", "packs", "pairs", "bottles"];

export function CoordinationFeedView({ variant }: CoordinationFeedViewProps) {
  const { user, selectedOrg, isSuperAdmin, isOrgAdmin } = useAuth();
  const qc = useQueryClient();

  // Try reading from OrganizationContext (present in Coordinator workspace)
  let orgData: { id?: string; name?: string } | undefined = undefined;
  try {
    const orgCtx = useOrganization();
    if (orgCtx?.organization) {
      orgData = { id: orgCtx.organization.id, name: orgCtx.organization.name };
    }
  } catch {
    // outside OrganizationProvider (e.g. admin layout)
  }
  const effectiveOrgId = orgData?.id || selectedOrg?.organization_id;
  const effectiveOrgName = orgData?.name || selectedOrg?.name;

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Post Composer State
  const [showComposer, setShowComposer] = useState(false);
  const [messageType, setMessageType] = useState<
    "GENERAL" | "CATEGORY_REQUEST" | "RESOURCE_ALERT" | "ANNOUNCEMENT"
  >("CATEGORY_REQUEST");
  const [content, setContent] = useState("");
  const [proposedCategory, setProposedCategory] = useState("");
  const [proposedUnit, setProposedUnit] = useState("units");

  // Reply State
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});

  // Quick Category Creation Modal
  const [categoryModalPost, setCategoryModalPost] = useState<FeedMessage | null>(null);
  const [catName, setCatName] = useState("");
  const [catUnit, setCatUnit] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Auto-refresh interval (every 8 seconds for responsive chat feel)
  const {
    data: messages = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<FeedMessage[]>({
    queryKey: ["coordination-feed", activeTab, statusFilter],
    queryFn: async () => {
      const res = await feedAPI.getAll({
        type: activeTab === "ALL" ? undefined : activeTab,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    },
    refetchInterval: 8000,
  });

  /* ── Create Post Mutation ── */
  const createPostMutation = useMutation({
    mutationFn: async (payload: {
      content: string;
      message_type: string;
      proposed_category?: string | undefined;
      proposed_unit?: string | undefined;
      parent_id?: string | undefined;
    }) => {
      const res = await feedAPI.create({
        ...payload,
        organization_id: effectiveOrgId,
        organization_name: effectiveOrgName,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["coordination-feed"] });
      if (!variables.parent_id) {
        setContent("");
        setProposedCategory("");
        setShowComposer(false);
        toast.success(
          variables.message_type === "CATEGORY_REQUEST"
            ? "Category request posted to Admin & Coordinators!"
            : "Message posted to Coordination Feed!",
        );
      } else {
        // Clear reply box
        setReplyContents((prev) => ({ ...prev, [variables.parent_id!]: "" }));
        toast.success("Reply sent!");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to post message");
    },
  });

  /* ── Toggle Reaction Mutation ── */
  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      return await feedAPI.toggleReaction(messageId, emoji);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coordination-feed"] });
    },
  });

  /* ── Update Status Mutation ── */
  const statusMutation = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: string; status: string }) => {
      return await feedAPI.updateStatus(messageId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coordination-feed"] });
    },
  });

  /* ── Admin Create Category Mutation ── */
  const createCategoryMutation = useMutation({
    mutationFn: async ({
      name,
      unit_of_measure,
      description,
      post,
    }: {
      name: string;
      unit_of_measure: string;
      description: string;
      post: FeedMessage;
    }) => {
      // 1. Create category in categories table
      await categoriesAPI.create({
        name,
        unit_of_measure,
        description,
      });

      // 2. Mark post status as RESOLVED
      await feedAPI.updateStatus(post.message_id, "RESOLVED");

      // 3. Post an automated reply in the thread confirming creation
      await feedAPI.create({
        parent_id: post.message_id,
        message_type: "GENERAL",
        content: `✅ Category "${name}" (${unit_of_measure}) has been approved and added to the platform! It is now available in inventory, requests, and donations.`,
        organization_name: "Super Admin",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coordination-feed"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setCategoryModalPost(null);
      toast.success("Category created and request marked as Resolved!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create category");
    },
  });

  const toggleThread = (messageId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleSendReply = (parentId: string) => {
    const text = replyContents[parentId]?.trim();
    if (!text) return;
    createPostMutation.mutate({
      parent_id: parentId,
      message_type: "GENERAL",
      content: text,
    });
  };

  const handleAdminAcknowledge = async (post: FeedMessage) => {
    try {
      await statusMutation.mutateAsync({
        messageId: post.message_id,
        status: "ACKNOWLEDGED",
      });
      // Add quick reply
      await feedAPI.create({
        parent_id: post.message_id,
        message_type: "GENERAL",
        content: `Acknowledged! I'll review and add the "${post.proposed_category || "requested"}" category shortly.`,
        organization_name: "Super Admin",
      });
      qc.invalidateQueries({ queryKey: ["coordination-feed"] });
      toast.success("Marked as acknowledged and notification sent to coordinators!");
    } catch {
      toast.error("Failed to acknowledge request");
    }
  };

  const openCategoryDialog = (post: FeedMessage) => {
    setCategoryModalPost(post);
    setCatName(post.proposed_category || "");
    setCatUnit(post.proposed_unit || "units");
    setCatDesc(
      `Requested by ${post.user_name} (${post.organization_name || "Coordinator"}) via Coordination Feed.`,
    );
  };

  // Counts for tabs
  const categoryRequestsCount = messages.filter(
    (m) => m.message_type === "CATEGORY_REQUEST" && m.status === "OPEN",
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Page Header / Sub-banner ── */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <MessageSquare className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Coordination Feed & Inter-Org Chat
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time collaboration between Organization Coordinators and System Administrators.
              Request new categories, alert on supplies, and coordinate disaster response.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              onClick={() => setShowComposer(!showComposer)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25"
            >
              <Plus className="h-4 w-4" />
              <span>{showComposer ? "Close Form" : "New Post / Request"}</span>
            </Button>
          </div>
        </div>

        {/* ── Active User & Org Context Bar ── */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Posting as:</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
            {user?.name || "User"} ({isSuperAdmin ? "Super Admin" : "Coordinator"})
          </span>
          {effectiveOrgName && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium">
              <Building2 className="h-3 w-3" />
              {effectiveOrgName}
            </span>
          )}
          <span className="ml-auto text-muted-foreground italic flex items-center gap-1">
            <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
            Live sync active
          </span>
        </div>
      </div>

      {/* ── Composer Card ── */}
      {showComposer && (
        <Card className="border-2 border-blue-500/30 shadow-lg rounded-2xl overflow-hidden transition-all duration-200">
          <div className="bg-muted/40 p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Compose New Communication</span>
            </div>
            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setMessageType("CATEGORY_REQUEST")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  messageType === "CATEGORY_REQUEST"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🏷️ Request Category
              </button>
              <button
                type="button"
                onClick={() => setMessageType("GENERAL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  messageType === "GENERAL"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                💬 General Discussion
              </button>
              <button
                type="button"
                onClick={() => setMessageType("RESOURCE_ALERT")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  messageType === "RESOURCE_ALERT"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🚨 Stock Alert
              </button>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {messageType === "CATEGORY_REQUEST" && (
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>Propose New Resource Category for Platform</span>
                </div>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                  Admins and other coordinators will see this request immediately. Once approved,
                  the new category will be selectable in inventories, donations, and citizen
                  requests.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Proposed Category Name *
                    </label>
                    <Input
                      placeholder="e.g., Life Jackets & Rescue Boats, Baby Formula..."
                      value={proposedCategory}
                      onChange={(e) => setProposedCategory(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Measurement Unit *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. units, kits, kg"
                        value={proposedUnit}
                        onChange={(e) => setProposedUnit(e.target.value)}
                        className="bg-background"
                      />
                      <Select value={proposedUnit} onValueChange={setProposedUnit}>
                        <SelectTrigger className="w-[110px] bg-background">
                          <SelectValue placeholder="Preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUGGESTED_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                {messageType === "CATEGORY_REQUEST"
                  ? "Details / Reason for Category Request *"
                  : "Message Content *"}
              </label>
              <Textarea
                rows={3}
                placeholder={
                  messageType === "CATEGORY_REQUEST"
                    ? "Explain why this category is needed and what items are coming in or required..."
                    : "Share an update with coordinators and administrators across organizations..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                All organization coordinators and system admins can view and react to this.
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComposer(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    createPostMutation.isPending ||
                    !content.trim() ||
                    (messageType === "CATEGORY_REQUEST" && !proposedCategory.trim())
                  }
                  onClick={() =>
                    createPostMutation.mutate({
                      content: content.trim(),
                      message_type: messageType,
                      proposed_category:
                        messageType === "CATEGORY_REQUEST" ? proposedCategory.trim() : undefined,
                      proposed_unit:
                        messageType === "CATEGORY_REQUEST" ? proposedUnit.trim() : undefined,
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 min-w-[120px]"
                >
                  {createPostMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{createPostMutation.isPending ? "Posting..." : "Post to Feed"}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Filters & Feed Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-foreground text-background shadow"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            All Messages
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CATEGORY_REQUEST")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "CATEGORY_REQUEST"
                ? "bg-blue-600 text-white shadow"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <span>🏷️ Category Requests</span>
            {categoryRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                {categoryRequestsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RESOURCE_ALERT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "RESOURCE_ALERT"
                ? "bg-amber-600 text-white shadow"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            🚨 Resource Alerts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ANNOUNCEMENT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ANNOUNCEMENT"
                ? "bg-purple-600 text-white shadow"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            📢 Announcements
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">🟡 Open</SelectItem>
              <SelectItem value="ACKNOWLEDGED">🔵 Acknowledged</SelectItem>
              <SelectItem value="RESOLVED">🟢 Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Messages List ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-muted/20">
          <div className="inline-flex p-4 rounded-full bg-muted text-muted-foreground mb-3">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No feed messages yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === "CATEGORY_REQUEST"
              ? "No category requests found. Organization coordinators can propose new categories using the button above."
              : "Start the conversation by posting an update, resource alert, or requesting a new category."}
          </p>
          <Button
            onClick={() => setShowComposer(true)}
            size="sm"
            className="mt-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Post</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((post) => {
            const isExpanded = !!expandedThreads[post.message_id];
            const replies = post.replies || [];
            const isCategoryReq = post.message_type === "CATEGORY_REQUEST";
            const userInitials = (post.user_name || "U")
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("");

            // Format relative time safely
            let timeAgo = "recently";
            try {
              if (post.created_at) {
                timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
              }
            } catch {
              timeAgo = "recently";
            }

            return (
              <Card
                key={post.message_id}
                className={`border rounded-2xl overflow-hidden transition-all duration-150 hover:shadow-md ${
                  isCategoryReq && post.status === "OPEN"
                    ? "border-blue-300 dark:border-blue-800 bg-blue-50/10"
                    : isCategoryReq && post.status === "RESOLVED"
                      ? "border-emerald-300 dark:border-emerald-900 bg-emerald-50/10"
                      : "border-border"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Author, Role, Org, Timestamp */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                        {userInitials || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {post.user_name}
                          </span>

                          {/* Role Badge */}
                          {post.user_role === "SUPER_ADMIN" ? (
                            <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 text-[10px] gap-1 font-semibold">
                              <ShieldAlert className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Coordinator
                            </Badge>
                          )}
                        </div>

                        {/* Org & Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {post.organization_name && (
                            <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                              <Building2 className="h-3 w-3" />
                              {post.organization_name}
                            </span>
                          )}
                          {post.organization_name && <span>•</span>}
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right side status / type badge */}
                    <div className="flex items-center gap-2">
                      {/* Message Type Badge */}
                      {post.message_type === "CATEGORY_REQUEST" && (
                        <Badge className="bg-blue-600 text-white text-[11px] gap-1 shadow-sm">
                          <Tag className="h-3 w-3" />
                          Category Request
                        </Badge>
                      )}
                      {post.message_type === "RESOURCE_ALERT" && (
                        <Badge className="bg-amber-600 text-white text-[11px] gap-1 shadow-sm">
                          <AlertTriangle className="h-3 w-3" />
                          Stock Alert
                        </Badge>
                      )}
                      {post.message_type === "ANNOUNCEMENT" && (
                        <Badge className="bg-purple-600 text-white text-[11px] gap-1 shadow-sm">
                          📢 Announcement
                        </Badge>
                      )}

                      {/* Request Status Badge */}
                      {isCategoryReq && (
                        <>
                          {post.status === "OPEN" && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px] gap-1"
                            >
                              <Clock className="h-3 w-3" />
                              Pending Admin
                            </Badge>
                          )}
                          {post.status === "ACKNOWLEDGED" && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 text-[11px] gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Admin In Progress
                            </Badge>
                          )}
                          {post.status === "RESOLVED" && (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[11px] gap-1"
                            >
                              <CheckCheck className="h-3 w-3" />
                              Created & Active
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Category Request Highlight Box */}
                  {isCategoryReq && post.proposed_category && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
                          Requested Resource Category
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground">
                            {post.proposed_category}
                          </span>
                          {post.proposed_unit && (
                            <Badge variant="secondary" className="text-xs">
                              Measured in: {post.proposed_unit}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Admin Quick Action Buttons */}
                      {(isSuperAdmin || variant === "admin") && post.status !== "RESOLVED" && (
                        <div className="flex items-center gap-2 pt-2 md:pt-0">
                          {post.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdminAcknowledge(post)}
                              disabled={statusMutation.isPending}
                              className="text-xs h-8 border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 gap-1.5"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span>"I'll Do It"</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => openCategoryDialog(post)}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create Category</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Content */}
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </div>

                  {/* Reactions & Thread Action Bar */}
                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                    {/* Emoji Reactions */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {COMMON_EMOJIS.map(({ emoji }) => {
                        const userList = post.reactions?.[emoji] || [];
                        const count = userList.length;
                        const hasReacted = user?.id ? userList.includes(user.id) : false;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              reactionMutation.mutate({
                                messageId: post.message_id,
                                emoji,
                              })
                            }
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                              hasReacted
                                ? "bg-blue-100 dark:bg-blue-950/80 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold scale-105"
                                : count > 0
                                  ? "bg-muted/70 border-border text-foreground hover:bg-muted"
                                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:border-border"
                            }`}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span>{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Replies Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleThread(post.message_id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>
                        {replies.length === 0
                          ? "Reply"
                          : `${replies.length} ${replies.length === 1 ? "Reply" : "Replies"}`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Thread / Replies Section */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border/60 space-y-3 bg-muted/20 -mx-5 -mb-5 p-5">
                      {/* Sub-replies List */}
                      {replies.length > 0 ? (
                        <div className="space-y-2.5">
                          {replies.map((reply) => {
                            const rInitials = (reply.user_name || "U")
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0]?.toUpperCase() ?? "")
                              .join("");
                            let rTime = "recently";
                            try {
                              if (reply.created_at) {
                                rTime = formatDistanceToNow(new Date(reply.created_at), {
                                  addSuffix: true,
                                });
                              }
                            } catch {
                              rTime = "recently";
                            }

                            const isFromAdmin =
                              reply.user_role === "SUPER_ADMIN" ||
                              reply.organization_name === "Super Admin";

                            return (
                              <div
                                key={reply.message_id}
                                className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                                  isFromAdmin
                                    ? "bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900"
                                    : "bg-background border-border"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-muted-foreground/20 text-foreground flex items-center justify-center font-bold text-[10px]">
                                      {rInitials || "U"}
                                    </div>
                                    <span className="font-semibold text-foreground">
                                      {reply.user_name}
                                    </span>
                                    {reply.organization_name && (
                                      <span className="text-muted-foreground text-[10px]">
                                        ({reply.organization_name})
                                      </span>
                                    )}
                                    {isFromAdmin && (
                                      <Badge className="bg-purple-600 text-white text-[9px] py-0 px-1 font-semibold">
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground text-[10px]">{rTime}</span>
                                </div>
                                <p className="text-foreground/90 whitespace-pre-wrap pl-8">
                                  {reply.content}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic pl-1">
                          No replies yet. Start the thread below:
                        </p>
                      )}

                      {/* Reply Input Box */}
                      <div className="flex gap-2 items-center pt-2">
                        <Input
                          placeholder="Type a reply... (e.g., 'Yes, our organization needs this too!' or 'On it!')"
                          value={replyContents[post.message_id] || ""}
                          onChange={(e) =>
                            setReplyContents((prev) => ({
                              ...prev,
                              [post.message_id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(post.message_id);
                            }
                          }}
                          className="bg-background text-xs"
                        />
                        <Button
                          size="sm"
                          disabled={
                            createPostMutation.isPending || !replyContents[post.message_id]?.trim()
                          }
                          onClick={() => handleSendReply(post.message_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-9"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Admin Direct Category Creation Modal ── */}
      <Dialog
        open={!!categoryModalPost}
        onOpenChange={(open) => !open && setCategoryModalPost(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              <span>Create Category from Coordinator Request</span>
            </DialogTitle>
            <DialogDescription>
              This will officially create the resource category and notify coordinators in the
              thread that it is active.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Category Name *
              </label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Life Jackets & Rescue Boats"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Unit of Measure *
              </label>
              <Input
                value={catUnit}
                onChange={(e) => setCatUnit(e.target.value)}
                placeholder="e.g. units, kits, kg"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Description</label>
              <Textarea
                rows={3}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Platform description for this category"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryModalPost(null)}>
              Cancel
            </Button>
            <Button
              disabled={createCategoryMutation.isPending || !catName.trim() || !catUnit.trim()}
              onClick={() => {
                if (!categoryModalPost) return;
                createCategoryMutation.mutate({
                  name: catName.trim(),
                  unit_of_measure: catUnit.trim(),
                  description: catDesc.trim(),
                  post: categoryModalPost,
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Approve & Create Category</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
