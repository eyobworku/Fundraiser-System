import { useEffect, useState } from "react";
import {
  useCampaigns,
  useUpdateCampaign,
  useDeleteCampaign,
  useCampaignsSearch,
} from "../../hooks/useCampaign";
import { useReleaseMoney } from "../../hooks/useRelease";
import {
  LayoutGrid,
  Flag,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Target,
  X,
  DollarSign,
  PauseCircle,
  User,
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Loader from "../../components/ui/Loader";
import SuspendCampaignModal from "./SuspendCampaignModal";
import { toast } from "react-toastify";
import Navbar from "../../components/layout/Navbar";
import Report from "./Report";
import { TopLoader, ButtonLoader } from "../../components/ui/OtherLoader";
import { useDebounce } from "../../hooks/useDebounce";
import TestimonialManagement from "./Testimonial";
import { useTranslation } from "react-i18next";

const CampaignManager = () => {
  const { t } = useTranslation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: 0,
    category: "",
    startDate: "",
    endDate: "",
  });
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignsPerPage, setCampaignsPerPage] = useState(10);

  const indexOfLastCampaign = currentPage * campaignsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSuspendClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsSuspendModalOpen(true);
  };

  const {
    data: campaigns,
    isLoading,
    isError,
    error,
  } = useCampaignsSearch(debouncedSearch);
  const updateCampaignMutation = useUpdateCampaign();
  const deleteCampaignMutation = useDeleteCampaign();
  const releaseMoneyMutation = useReleaseMoney();

  const handleStatusToggle = async (campaign) => {
    const newStatus = campaign.status === "approved" ? "rejected" : "approved";
    try {
      await updateCampaignMutation.mutateAsync({
        id: campaign._id,
        status: newStatus,
      });
      toast.success(
        t(
          `campaign_${
            newStatus === "approved" ? "approved" : "rejected"
          }_success`
        )
      );
    } catch (error) {
      toast.error(
        t(
          `failed_to_${
            newStatus === "approved" ? "approve" : "reject"
          }_campaign`
        )
      );
      console.error("Status update failed:", error);
    }
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    try {
      await updateCampaignMutation.mutateAsync({
        id: editingCampaign._id,
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      setEditingCampaign(null);
      toast.success(t("campaign_updated_success"));
    } catch (error) {
      toast.error(t("update_failed"));
      console.error("Update failed:", error);
    }
  };

  const handleReleaseCampaign = async (campaign) => {
    if (window.confirm(t("confirm_release_campaign"))) {
      try {
        await releaseMoneyMutation.mutateAsync(campaign._id);
      } catch (error) {
        console.error("Release failed:", error);
        toast.error(t("release_failed"));
      }
    }
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getStatusBadge = (status) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-sm flex items-center gap-2";
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <div
            className={`${baseClasses} bg-gradient-to-r from-green-400 to-green-600 text-white`}
          >
            <CheckCircle2 size={16} />
            {t("approved")}
          </div>
        );
      case "rejected":
        return (
          <div
            className={`${baseClasses} bg-gradient-to-r from-red-400 to-red-600 text-white`}
          >
            <XCircle size={16} />
            {t("rejected")}
          </div>
        );
      default:
        return (
          <div
            className={`${baseClasses} bg-gradient-to-r from-gray-400 to-gray-600 text-white`}
          >
            {t(status.toLowerCase())}
          </div>
        );
    }
  };

  const getReleaseStatus = (status) => {
    if (status === "requested") {
      return (
        <span className="bg-yellow-100 text-yellow-800 text-sm mr-2 px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300 flex items-center gap-1">
          <DollarSign size={14} />
          {t("release_requested")}
        </span>
      );
    } else if (status === "released") {
      return (
        <span className="bg-green-500 text-white text-sm mr-2 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <DollarSign size={14} />
          {t("released")}
        </span>
      );
    }
    return null;
  };

  if (isError) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50 items-center justify-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4"
        >
          <div className="text-red-500 text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error?.message || t("failed_to_load_campaigns")}
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
            onClick={() => window.location.reload()}
          >
            {t("refresh_dashboard")}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Sidebar */}
        <motion.aside
          initial="expanded"
          animate={isSidebarCollapsed ? "collapsed" : "expanded"}
          variants={sidebarVariants}
          className="bg-white shadow-2xl border-r border-gray-100"
        >
          <div className="p-6 flex justify-between items-center border-b border-gray-100">
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-bold text-2xl bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent"
                >
                  {t("manager_panel")}
                </motion.h2>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-gray-50 text-gray-600"
            >
              {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </motion.button>
          </div>
          <nav className="p-4">
            <motion.ul className="space-y-3">
              {["campaigns", "report", "testimonials"].map((tab) => (
                <motion.li key={tab}>
                  <motion.button
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(tab)}
                    className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all ${
                      selectedTab === tab
                        ? "bg-orange-50 text-orange-600 shadow-inner"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {tab === "campaigns" && <LayoutGrid size={24} />}
                    {tab === "report" && <Flag size={24} />}
                    {tab === "testimonials" && <MessageSquare size={24} />}
                    {!isSidebarCollapsed && (
                      <span className="capitalize font-medium">{t(tab)}</span>
                    )}
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>
          </nav>
        </motion.aside>
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8">
          {selectedTab === "campaigns" ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="mb-8 flex items-center justify-between sm:flex-row flex-col">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t("campaign_management")}
                  </h1>
                  <p className="text-gray-600">
                    {t("manage_campaigns_description")}
                  </p>
                </div>
                <input
                  type="text"
                  placeholder={t("search_campaigns")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 mb-4"
                />
              </div>
              {isLoading && <TopLoader />}
              <LayoutGroup>
                <motion.div className="grid grid-cols-1 gap-4">
                  <AnimatePresence>
                    {campaigns?.map((campaign) => (
                      <motion.div
                        key={campaign._id}
                        layout
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {campaign.title}
                                </h3>
                                {getStatusBadge(campaign.status)}
                                {getReleaseStatus(campaign.releaseStatus)}
                              </div>
                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock size={16} />
                                  <span>
                                    {formatDate(campaign.startDate)} -{" "}
                                    {formatDate(campaign.endDate)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target size={16} />
                                  <span>
                                    {t("goal")}:{" "}
                                    {campaign.goalAmount?.toLocaleString()}{" "}
                                    {t("birr")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign size={16} />
                                  <span>
                                    {t("raised")}:{" "}
                                    {campaign.raisedAmount?.toLocaleString()}{" "}
                                    {t("birr")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User size={16} />
                                  <span>{campaign.userId?.name} </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setExpandedCampaignId(
                                    expandedCampaignId === campaign._id
                                      ? null
                                      : campaign._id
                                  )
                                }
                                className="p-2 hover:bg-gray-50 rounded-lg"
                              >
                                {expandedCampaignId === campaign._id ? (
                                  <ChevronUp />
                                ) : (
                                  <ChevronDown />
                                )}
                              </motion.button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedCampaignId === campaign._id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 pt-4 border-t border-gray-100"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <CalendarDays size={18} />
                                        {t("campaign_timeline")}
                                      </h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <span className="font-medium w-16">
                                            {t("start")}:
                                          </span>
                                          <span>
                                            {formatDate(campaign.startDate)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <span className="font-medium w-16">
                                            {t("end")}:
                                          </span>
                                          <span>
                                            {formatDate(campaign.endDate)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <h4 className="font-medium mb-2">
                                      {t("management_actions")}
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                      {campaign.status !== "suspended" &&
                                        campaign.status !== "completed" && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                              handleStatusToggle(campaign)
                                            }
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                                              campaign.status === "approved"
                                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                                                : "bg-green-100 text-green-800 hover:bg-green-200"
                                            }`}
                                          >
                                            {campaign.status === "approved" ? (
                                              <XCircle size={16} />
                                            ) : (
                                              <CheckCircle2 size={16} />
                                            )}
                                            {campaign.status === "approved"
                                              ? t("cancel_campaign")
                                              : t("approve_campaign")}
                                          </motion.button>
                                        )}
                                      {campaign.releaseStatus !== "released" &&
                                        campaign.raisedAmount > 0 && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                              handleReleaseCampaign(campaign)
                                            }
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 ${
                                              campaign.status === "completed"
                                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                : ""
                                            }`}
                                            disabled={
                                              releaseMoneyMutation.isPending &&
                                              releaseMoneyMutation.variables ===
                                                campaign._id
                                            }
                                          >
                                            {releaseMoneyMutation.isPending &&
                                            releaseMoneyMutation.variables ===
                                              campaign._id ? (
                                              <ButtonLoader />
                                            ) : (
                                              <DollarSign size={16} />
                                            )}
                                            {t("release_funds")}
                                          </motion.button>
                                        )}
                                      {campaign.releaseStatus !== "released" &&
                                        campaign.raisedAmount > 0 && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                              handleSuspendClick(campaign)
                                            }
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200`}
                                          >
                                            <PauseCircle size={16} />
                                            {t("suspend")}
                                          </motion.button>
                                        )}
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          setEditingCampaign(campaign);
                                          setFormData({
                                            title: campaign.title,
                                            description: campaign.description,
                                            goalAmount: campaign.goalAmount,
                                            category: campaign.category,
                                            startDate:
                                              campaign.startDate.split("T")[0],
                                            endDate:
                                              campaign.endDate.split("T")[0],
                                          });
                                        }}
                                        className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 flex items-center gap-2 text-sm font-medium"
                                      >
                                        <Edit3 size={16} /> {t("edit")}
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                          toast.info(
                                            ({ closeToast }) => (
                                              <div>
                                                <p className="text-sm text-gray-800">
                                                  {t("confirm_delete_campaign")}
                                                </p>
                                                <div className="flex gap-3 mt-3">
                                                  <button
                                                    onClick={() => {
                                                      deleteCampaignMutation.mutate(
                                                        campaign._id
                                                      );
                                                      toast.dismiss();
                                                    }}
                                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                                    disabled={
                                                      deleteCampaignMutation.isPending &&
                                                      deleteCampaignMutation.variables ===
                                                        campaign._id
                                                    }
                                                  >
                                                    {deleteCampaignMutation.isPending &&
                                                    deleteCampaignMutation.variables ===
                                                      campaign._id
                                                      ? t("deleting")
                                                      : t("yes_delete")}
                                                  </button>
                                                  <button
                                                    onClick={closeToast}
                                                    className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
                                                  >
                                                    {t("no")}
                                                  </button>
                                                </div>
                                              </div>
                                            ),
                                            {
                                              autoClose: false,
                                              closeOnClick: false,
                                              draggable: false,
                                              closeButton: false,
                                              position: "top-center",
                                            }
                                          );
                                        }}
                                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm font-medium"
                                        disabled={
                                          deleteCampaignMutation.isPending &&
                                          deleteCampaignMutation.variables ===
                                            campaign._id
                                        }
                                      >
                                        <Trash2 size={16} /> {t("delete")}
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            </motion.div>
          ) : selectedTab === "report" ? (
            <Report />
          ) : (
            <TestimonialManagement />
          )}
          {/* Edit Modal */}
          <AnimatePresence>
            {editingCampaign && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">
                      {t("edit_campaign")}
                    </h3>
                    <button
                      onClick={() => setEditingCampaign(null)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateCampaign} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("title")}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("description")}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("start_date")}
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.startDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("end_date")}
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              })
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            min={formData.startDate}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("goal_amount_birr")}
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.goalAmount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                goalAmount: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("category")}
                          </label>
                          <select
                            value={formData.category}
                            required
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                          >
                            <option value="" disabled>
                              {t("select_category")}
                            </option>
                            <option value="Medical">{t("medical")}</option>
                            <option value="Education">{t("education")}</option>
                            <option value="Religious">{t("religious")}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setEditingCampaign(null)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                      >
                        {t("cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={updateCampaignMutation.isPending}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 flex items-center gap-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {updateCampaignMutation.isPending ? (
                          <>
                            <ButtonLoader /> {t("updating")}...
                          </>
                        ) : (
                          t("save_changes")
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Suspend and Reallocate Modal */}
        <SuspendCampaignModal
          isOpen={isSuspendModalOpen}
          onClose={() => setIsSuspendModalOpen(false)}
          campaignToSuspend={selectedCampaign}
        />
      </div>
    </div>
  );
};

export default CampaignManager;
