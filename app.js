"use strict";

const STORAGE_KEY = "creative-monitor-state-v1";
const API_STATE_URL = "/api/state";
const API_PROJECT_FOLDERS_URL = "/api/projects/folders";
const API_UPLOAD_START_URL = "/api/assets/chunked/start";
const API_PROXY_QUEUE_URL = "/api/assets/proxy/queue";
let saveTimer = null;
let lastDeviceNotificationAt = 0;
const AUTH_USER = parseAuthUser();

const workflowStages = [
  "Content Request",
  "Planning",
  "Research",
  "Script Writing",
  "Internal Review",
  "Management Approval",
  "Graphic Design",
  "Video Production",
  "Editing",
  "Motion Graphics",
  "Sound Mixing",
  "Quality Assurance",
  "Final Review",
  "Client Approval",
  "Scheduling",
  "Publishing",
  "Archive"
];

const departments = [
  "Creative Operations"
];

const projectTypes = [
  "Client Campaign Video",
  "Short-form Video",
  "Podcast / Long-form Video",
  "Internal Video",
  "Production Support",
  "Motion / Design Support",
  "Publishing Package"
];

const workflowTemplates = [
  ["none", "No auto tasks"],
  ["standard-video", "Standard Video Production"],
  ["short-form", "Short-form Social Video"],
  ["podcast", "Podcast / Long-form Video"],
  ["publishing-only", "Publishing Package Only"]
];

const workflowTaskTemplates = {
  "standard-video": [
    { name: "Complete creative brief", stage: "Planning", role: "owner", reviewer: "owner", hours: 4, dueOffset: 1 },
    { name: "Scriptwriting", stage: "Script Writing", role: "scriptwriter", reviewer: "owner", hours: 8, dueOffset: 3 },
    { name: "Script checking", stage: "Internal Review", role: "checker", reviewer: "owner", hours: 3, dueOffset: 4 },
    { name: "Fact verification", stage: "Research", role: "verifier", reviewer: "owner", hours: 3, dueOffset: 5 },
    { name: "Raw material readiness", stage: "Video Production", role: "producer", reviewer: "owner", hours: 4, dueOffset: 6 },
    { name: "Editing and version submission", stage: "Editing", role: "editor", reviewer: "qc", hours: 24, dueOffset: 10 },
    { name: "QC review", stage: "Quality Assurance", role: "qc", reviewer: "owner", hours: 4, dueOffset: 11 },
    { name: "Revision pass", stage: "Editing", role: "editor", reviewer: "qc", hours: 8, dueOffset: 12 },
    { name: "Final verification", stage: "Final Review", role: "verifier", reviewer: "approver", hours: 3, dueOffset: 13 },
    { name: "Manager approval", stage: "Client Approval", role: "approver", reviewer: "owner", hours: 2, dueOffset: 14 },
    { name: "Publishing setup", stage: "Publishing", role: "publisher", reviewer: "owner", hours: 3, dueOffset: 15 }
  ],
  "short-form": [
    { name: "Brief and platform requirements", stage: "Planning", role: "owner", reviewer: "owner", hours: 3, dueOffset: 1 },
    { name: "Edit short-form cut", stage: "Editing", role: "editor", reviewer: "qc", hours: 10, dueOffset: 4 },
    { name: "Subtitle and graphics pass", stage: "Motion Graphics", role: "designer", reviewer: "editor", hours: 5, dueOffset: 5 },
    { name: "QC review", stage: "Quality Assurance", role: "qc", reviewer: "owner", hours: 3, dueOffset: 6 },
    { name: "Approval", stage: "Client Approval", role: "approver", reviewer: "owner", hours: 2, dueOffset: 7 },
    { name: "Schedule and publish", stage: "Publishing", role: "publisher", reviewer: "owner", hours: 3, dueOffset: 8 }
  ],
  podcast: [
    { name: "Episode brief and outline", stage: "Planning", role: "scriptwriter", reviewer: "owner", hours: 8, dueOffset: 2 },
    { name: "Raw recording readiness", stage: "Video Production", role: "producer", reviewer: "owner", hours: 4, dueOffset: 4 },
    { name: "Long-form edit", stage: "Editing", role: "editor", reviewer: "qc", hours: 30, dueOffset: 9 },
    { name: "Audio mix", stage: "Sound Mixing", role: "audio", reviewer: "qc", hours: 10, dueOffset: 10 },
    { name: "QC review", stage: "Quality Assurance", role: "qc", reviewer: "owner", hours: 5, dueOffset: 11 },
    { name: "Approval", stage: "Client Approval", role: "approver", reviewer: "owner", hours: 2, dueOffset: 12 },
    { name: "Publish episode and clips", stage: "Publishing", role: "publisher", reviewer: "owner", hours: 5, dueOffset: 14 }
  ],
  "publishing-only": [
    { name: "Confirm final files and captions", stage: "Final Review", role: "publisher", reviewer: "owner", hours: 2, dueOffset: 1 },
    { name: "Approval check", stage: "Client Approval", role: "approver", reviewer: "owner", hours: 1, dueOffset: 2 },
    { name: "Schedule and publish", stage: "Publishing", role: "publisher", reviewer: "owner", hours: 3, dueOffset: 3 }
  ]
};

const taskStatuses = [
  "Pending",
  "In Progress",
  "Waiting Review",
  "Waiting Approval",
  "Revision Required",
  "Blocked",
  "Completed",
  "Cancelled"
];

const approvalLevels = [
  "Designer",
  "Senior Designer",
  "Creative Lead",
  "Marketing Manager",
  "General Manager",
  "Client"
];

const navItems = [
  ["dashboard", "Dashboard", "grid"],
  ["editor", "My Work", "check"],
  ["projects", "Projects", "folder"],
  ["videos", "Video Tracker", "camera"],
  ["tasks", "Tasks", "check"],
  ["qc", "QC", "stamp"],
  ["approvals", "Approvals", "stamp"],
  ["assets", "Server Links", "image"],
  ["team", "Staff", "users"],
  ["reports", "Reports", "chart"],
  ["admin", "Admin", "gear"],
  ["settings", "Settings", "gear"]
];

const widgetLabels = {
  activeProjects: "Active projects",
  completedProjects: "Completed projects",
  projectsAtRisk: "Projects at risk",
  overdueProjects: "Overdue projects",
  upcomingDeadlines: "Upcoming deadlines",
  teamWorkload: "Team workload",
  serverLinks: "Server links",
  proxyQueue: "Proxy queue",
  pendingApprovals: "Pending approvals",
  revisionRequests: "Revision requests",
  publishedContent: "Published content",
  clientWaiting: "Client waiting approvals"
};

const icons = {
  grid: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z\" fill=\"currentColor\"/></svg>",
  folder: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z\" fill=\"currentColor\"/></svg>",
  check: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m9.4 16.6-4-4L7 11l2.4 2.4L17.8 5l1.6 1.6-10 10Z\" fill=\"currentColor\"/></svg>",
  stamp: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3a4 4 0 0 1 2 7.46V14h4a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h4v-3.54A4 4 0 0 1 12 3ZM5 20h14v2H5v-2Z\" fill=\"currentColor\"/></svg>",
  image: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 12.2 4.2-4.2 3.2 3.2 2.1-2.1L19 17.6V6H5v10.2ZM8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" fill=\"currentColor\"/></svg>",
  camera: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8.2 5 10 3h4l1.8 2H20a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z\" fill=\"currentColor\"/></svg>",
  calendar: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 2h2v3h6V2h2v3h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V2Zm12 8H5v10h14V10Z\" fill=\"currentColor\"/></svg>",
  users: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.5 1A3.5 3.5 0 1 1 19 9.5a3.5 3.5 0 0 1-3.5 3.5ZM2 20a7 7 0 0 1 14 0v1H2v-1Zm13.4 1A8.7 8.7 0 0 0 13 15.4 6 6 0 0 1 22 20v1h-6.6Z\" fill=\"currentColor\"/></svg>",
  chart: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 19h16v2H4V3h2v14h3V9h4v8h3V5h4v12h2v2H4Z\" fill=\"currentColor\"/></svg>",
  gear: "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"m12 2 2.1.8.6 2.2 2.2.9 2-.9 2.1 3.6-1.7 1.5.3 2.4 1.8 1.4-2.1 3.6-2.2-.7-1.9 1.4-.4 2.3H10l-.4-2.3-1.9-1.4-2.2.7-2.1-3.6 1.8-1.4.3-2.4-1.7-1.5L5.9 5l2 .9 2.2-.9.6-2.2L12 2Zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z\" fill=\"currentColor\"/></svg>"
};

const seed = {
  ui: {
    view: "dashboard",
    currentUser: "Ari Lim",
    currentRole: "Editor",
    focusMode: "today",
    selectedProjectId: "p-1001",
    projectSearch: "",
    projectStatus: "All",
    projectDepartment: "All",
    taskSearch: "",
    taskStatus: "All",
    assetSearch: "",
    videoSearch: "",
    qcFilter: "All",
    deviceNotifications: false
  },
  notifications: [
    { id: "nt-1", user: "Maya Noor", type: "editing_progress", title: "Editing progress updated", message: "Ari Lim updated Assemble rough cut v2 to 75%.", linkView: "tasks", read: false, createdAt: datePlus(0) },
    { id: "nt-2", user: "Ari Lim", type: "revision", title: "Revision requested", message: "Podcast identity board needs alternate cover art.", linkView: "approvals", read: false, createdAt: datePlus(-1) },
    { id: "nt-3", user: "Sofia Chan", type: "approval", title: "Client approval pending", message: "Annual report proof is waiting for client approval.", linkView: "approvals", read: true, createdAt: datePlus(-1) }
  ],
  settings: {
    dashboardWidgets: {
      activeProjects: true,
      completedProjects: true,
      projectsAtRisk: true,
      overdueProjects: true,
      upcomingDeadlines: true,
      teamWorkload: true,
      serverLinks: true,
      proxyQueue: true,
      pendingApprovals: true,
      revisionRequests: true,
      publishedContent: true,
      clientWaiting: true
    },
    security: {
      mfa: true,
      sessionTimeout: true,
      encryptedStorage: true,
      ipRestrictions: false,
      secureBackups: true
    },
    theme: "light"
  },
  projects: [
    {
      id: "p-1001",
      name: "Seasonal Product Launch Film",
      code: "CR-2026-001",
      client: "Finesse Foods",
      department: "Creative Operations",
      campaign: "Q3 Launch",
      type: "Client Campaign Video",
      priority: "High",
      status: "In Progress",
      description: "Hero launch film with cutdowns for paid social and retail screens.",
      objectives: "Increase launch awareness and provide platform-specific content assets.",
      targetAudience: "Urban families and food service buyers",
      platform: "YouTube, Instagram, TikTok",
      budget: 42000,
      assignedManager: "Maya Noor",
      assignedTeamMembers: ["Ari Lim", "Dina Rahman", "Ken Wong"],
      internalNotes: "Color grade must match brand refresh.",
      clientNotes: "Client wants warm product close-ups.",
      startDate: datePlus(-18),
      deadline: datePlus(9),
      expectedCompletion: datePlus(7),
      actualCompletion: "",
      estimatedHours: 180,
      actualHours: 124,
      workflowStage: "Editing",
      tags: ["launch", "video", "paid-social"],
      categories: ["Campaign", "Retail"],
      milestones: ["Creative brief locked", "Shoot completed", "Rough cut delivered"],
      deliverables: ["Hero film 60s", "Vertical cutdown 15s", "Retail loop 10s"],
      creativeBrief: brief({
        clientBackground: "Regional food brand with an active retail and hospitality channel.",
        businessObjectives: "Support retail sell-in and digital demand generation.",
        toneOfVoice: "Fresh, confident, precise",
        aspectRatio: "16:9, 9:16, 1:1",
        duration: "60s, 15s, 10s",
        fileFormat: "MP4, MOV"
      })
    },
    {
      id: "p-1002",
      name: "Annual Report Visual System",
      code: "CR-2026-002",
      client: "Northstar Capital",
      department: "Creative Operations",
      campaign: "Investor Relations",
      type: "Motion / Design Support",
      priority: "Medium",
      status: "Waiting Approval",
      description: "Design system, layout templates, icons, and executive presentation assets.",
      objectives: "Produce a polished investor report package with consistent visual language.",
      targetAudience: "Investors and board members",
      platform: "PDF, print, presentation",
      budget: 28000,
      assignedManager: "Sofia Chan",
      assignedTeamMembers: ["Nur Ali", "Peter Tan"],
      internalNotes: "Financial charts require legal review.",
      clientNotes: "Conservative visual tone, avoid excessive illustration.",
      startDate: datePlus(-26),
      deadline: datePlus(4),
      expectedCompletion: datePlus(3),
      actualCompletion: "",
      estimatedHours: 150,
      actualHours: 128,
      workflowStage: "Client Approval",
      tags: ["report", "print", "brand"],
      categories: ["Corporate"],
      milestones: ["Layout direction approved", "Charts delivered", "Proof sent"],
      deliverables: ["Annual report PDF", "Print-ready package", "Board deck"],
      creativeBrief: brief({
        clientBackground: "Financial services company preparing investor communications.",
        businessObjectives: "Present performance and strategy with clarity.",
        toneOfVoice: "Measured, direct, premium",
        aspectRatio: "A4, 16:9",
        fileFormat: "PDF, INDD, PPTX"
      })
    },
    {
      id: "p-1003",
      name: "Podcast Studio Pilot",
      code: "CR-2026-003",
      client: "Internal Marketing",
      department: "Creative Operations",
      campaign: "Thought Leadership",
      type: "Podcast / Long-form Video",
      priority: "High",
      status: "At Risk",
      description: "Pilot episode recording package with identity, sound design, and launch cuts.",
      objectives: "Validate production format and publish a pilot on owned channels.",
      targetAudience: "Enterprise operators and partners",
      platform: "Spotify, YouTube, LinkedIn",
      budget: 16500,
      assignedManager: "Amir Hassan",
      assignedTeamMembers: ["Jon Lee", "Ari Lim", "Rina Park"],
      internalNotes: "Guest availability may slip recording date.",
      clientNotes: "Leadership wants intro music options.",
      startDate: datePlus(-9),
      deadline: datePlus(2),
      expectedCompletion: datePlus(6),
      actualCompletion: "",
      estimatedHours: 92,
      actualHours: 50,
      workflowStage: "Sound Mixing",
      tags: ["podcast", "audio", "internal"],
      categories: ["Owned Content"],
      milestones: ["Format approved", "Episode outline drafted"],
      deliverables: ["Pilot audio", "Video highlights", "Podcast cover art"],
      creativeBrief: brief({
        clientBackground: "Internal marketing team building executive thought leadership.",
        businessObjectives: "Create reusable editorial format.",
        toneOfVoice: "Sharp, credible, conversational",
        aspectRatio: "16:9, 1:1",
        duration: "35m, 60s clips",
        fileFormat: "MP3, MP4, PNG"
      })
    },
    {
      id: "p-1004",
      name: "Retail Photography Refresh",
      code: "CR-2026-004",
      client: "Metro Retail Group",
      department: "Creative Operations",
      campaign: "Store Refresh",
      type: "Production Support",
      priority: "Low",
      status: "Planning",
      description: "Photography package for store signage, product displays, and web catalog.",
      objectives: "Refresh seasonal retail photography library.",
      targetAudience: "Retail shoppers and ecommerce customers",
      platform: "Website, store displays, catalog",
      budget: 24000,
      assignedManager: "Leah Ong",
      assignedTeamMembers: ["Dina Rahman", "Chris Yap"],
      internalNotes: "Coordinate overnight access with store ops.",
      clientNotes: "Natural light feel, avoid heavy retouching.",
      startDate: datePlus(1),
      deadline: datePlus(24),
      expectedCompletion: datePlus(22),
      actualCompletion: "",
      estimatedHours: 130,
      actualHours: 6,
      workflowStage: "Planning",
      tags: ["photo", "retail", "catalog"],
      categories: ["Production"],
      milestones: ["Shot list approved"],
      deliverables: ["Hero images", "Product detail images", "Store environment set"],
      creativeBrief: brief({
        clientBackground: "Retail chain refreshing seasonal store and ecommerce assets.",
        businessObjectives: "Increase appeal of featured ranges.",
        toneOfVoice: "Bright, accessible, premium",
        aspectRatio: "4:5, 3:2, 1:1",
        duration: "N/A",
        fileFormat: "JPEG, TIFF, PSD"
      })
    },
    {
      id: "p-1005",
      name: "Independence Day Social Pack",
      code: "CR-2026-005",
      client: "Civic Arts Council",
      department: "Creative Operations",
      campaign: "National Day",
      type: "Publishing Package",
      priority: "Medium",
      status: "Completed",
      description: "Static and motion posts for event countdown and public service messaging.",
      objectives: "Publish campaign pack before national event week.",
      targetAudience: "Public followers and event attendees",
      platform: "Instagram, Facebook, TikTok",
      budget: 12800,
      assignedManager: "Sofia Chan",
      assignedTeamMembers: ["Nur Ali", "Rina Park"],
      internalNotes: "Final source files archived.",
      clientNotes: "Approved with minor copy edits.",
      startDate: datePlus(-48),
      deadline: datePlus(-7),
      expectedCompletion: datePlus(-9),
      actualCompletion: datePlus(-8),
      estimatedHours: 82,
      actualHours: 79,
      workflowStage: "Archive",
      tags: ["social", "motion", "event"],
      categories: ["Published"],
      milestones: ["Creative direction", "Motion versions", "Published"],
      deliverables: ["Countdown posts", "Stories pack", "Motion bumper"],
      creativeBrief: brief({
        clientBackground: "Public arts organization managing national event comms.",
        businessObjectives: "Drive awareness and attendance.",
        toneOfVoice: "Warm, inclusive, energetic",
        aspectRatio: "9:16, 1:1",
        duration: "6s, 15s",
        fileFormat: "MP4, PNG"
      })
    }
  ],
  tasks: [
    task("t-1", "p-1001", "Assemble rough cut v2", "Editing", "High", "Ari Lim", "Maya Noor", datePlus(-2), datePlus(1), 24, 18, "In Progress", 1),
    task("t-2", "p-1001", "Export vertical cutdowns", "Editing", "Medium", "Dina Rahman", "Maya Noor", datePlus(1), datePlus(5), 18, 0, "Pending", 0),
    task("t-3", "p-1001", "Sound pass and mix notes", "Sound Mixing", "Medium", "Ken Wong", "Ari Lim", datePlus(2), datePlus(6), 12, 0, "Pending", 0),
    task("t-4", "p-1002", "Client proof annotations", "Client Approval", "High", "Peter Tan", "Sofia Chan", datePlus(-1), datePlus(1), 10, 8, "Waiting Approval", 2),
    task("t-5", "p-1002", "Financial chart corrections", "Final Review", "Medium", "Nur Ali", "Sofia Chan", datePlus(-3), datePlus(0), 14, 12, "Revision Required", 3),
    task("t-6", "p-1003", "Guest release forms", "Planning", "High", "Amir Hassan", "Maya Noor", datePlus(-4), datePlus(-1), 5, 2, "Blocked", 0),
    task("t-7", "p-1003", "Intro music options", "Sound Mixing", "Medium", "Ken Wong", "Amir Hassan", datePlus(0), datePlus(2), 8, 4, "In Progress", 1),
    task("t-8", "p-1004", "Location recce", "Planning", "Low", "Chris Yap", "Leah Ong", datePlus(2), datePlus(8), 12, 0, "Pending", 0),
    task("t-9", "p-1005", "Archive final deliverables", "Archive", "Low", "Rina Park", "Sofia Chan", datePlus(-11), datePlus(-8), 5, 5, "Completed", 0)
  ],
  approvals: [
    approval("a-1", "p-1001", "Hero film rough cut v2", "Creative Lead", "Maya Noor", "Pending", datePlus(1), "Video timing and product shots"),
    approval("a-2", "p-1002", "Annual report proof", "Client", "Northstar Client", "Pending", datePlus(2), "Executive proof package"),
    approval("a-3", "p-1003", "Podcast identity board", "Marketing Manager", "Sofia Chan", "Revision Requested", datePlus(-1), "Needs alternate cover art"),
    approval("a-4", "p-1005", "Motion bumper", "Client", "Civic Client", "Approved", datePlus(-10), "Published")
  ],
  equipment: [],
  assets: [
    asset("as-1", "Hero_RoughCut_v2.mov", "MOV", "p-1001", "Video", 2, ["rough-cut", "client-review"], "Waiting Approval", 18),
    asset("as-2", "AnnualReport_Master.indd", "INDD", "p-1002", "Project File", 5, ["layout", "source"], "Revision Required", 12),
    asset("as-3", "Podcast_Cover_Concepts.fig", "Figma", "p-1003", "Brand Asset", 3, ["cover", "identity"], "Revision Required", 8),
    asset("as-4", "NationalDay_Bumper_Final.mp4", "MP4", "p-1005", "Final Deliverable", 1, ["published", "motion"], "Approved", 34),
    asset("as-5", "Retail_Shotlist.pdf", "PDF", "p-1004", "Brief", 1, ["shot-list", "photo"], "Approved", 5)
  ],
  team: [
    person("u-1", "Maya Noor", "Creative Lead", "Creative Operations", "Admin", 88, ["Approval", "Resource planning", "Video review"]),
    person("u-2", "Sofia Chan", "Design Manager", "Creative Operations", "Manager", 76, ["Design systems", "Client proofing"]),
    person("u-3", "Ari Lim", "Video Editor", "Creative Operations", "Member", 92, ["Editing", "Color", "Motion"]),
    person("u-4", "Dina Rahman", "Production Coordinator", "Creative Operations", "Member", 68, ["Production prep", "Raw readiness checks"]),
    person("u-5", "Ken Wong", "Audio Producer", "Creative Operations", "Member", 54, ["Mixing", "Voice cleanup"]),
    person("u-6", "Rina Park", "Motion Designer", "Creative Operations", "Freelancer", 61, ["Motion posts", "Explainers"]),
    person("u-7", "Nur Ali", "Designer", "Creative Operations", "Member", 83, ["Reports", "Social templates"]),
    person("u-8", "Chris Yap", "Publishing Assistant", "Publishing", "Limited", 45, ["Scheduling", "Live URL checks"])
  ],
  announcements: [
    { id: "n-1", title: "Studio B unavailable", body: "Maintenance window booked for Friday afternoon.", date: datePlus(1), owner: "Operations" },
    { id: "n-2", title: "Brand asset audit", body: "Logo and font folders are being reconciled this week.", date: datePlus(-1), owner: "Design" }
  ],
  audit: [
    logEntry("System", "Dashboard widgets updated", datePlus(-1)),
    logEntry("Maya Noor", "Approved access for freelancer role", datePlus(-2)),
    logEntry("Sofia Chan", "Created project CR-2026-002", datePlus(-26)),
    logEntry("Ari Lim", "Registered Hero_RoughCut_v2.mov NAS path", datePlus(-3)),
    logEntry("Client", "Requested revision on podcast identity board", datePlus(-1))
  ],
  workflowWeightage: [
    { stage: "Briefing", weight: 5 },
    { stage: "Scriptwriting", weight: 10 },
    { stage: "Script Checking", weight: 5 },
    { stage: "Fact Verification", weight: 5 },
    { stage: "Recording / Raw Ready", weight: 10 },
    { stage: "Editing", weight: 35 },
    { stage: "QC", weight: 15 },
    { stage: "Final Verification and Approval", weight: 10 },
    { stage: "Publishing", weight: 5 }
  ],
  videos: [
    {
      id: "VID-0128",
      projectId: "p-1001",
      title: "Seasonal launch hero cut",
      contentType: "Client Campaign",
      platform: "Instagram, TikTok, Retail Screens",
      format: "16:9, 9:16, 1:1",
      duration: "60s master, 15s cutdowns",
      resolution: "4K master, 1080p social",
      aspectRatio: "16:9 / 9:16 / 1:1",
      scriptwriter: "Ari Lim",
      checker: "Sofia Chan",
      verifier: "Maya Noor",
      editor: "Ari Lim",
      qc: "Maya Noor",
      approver: "Maya Noor",
      publisher: "Sofia Chan",
      currentStage: "Editing",
      detailedStatus: "Submitted for QC",
      progress: 75,
      difficulty: 4,
      redFlag: "Amber",
      blocker: "Awaiting subtitle QC",
      rawPath: "projects/CR-2026-001-Seasonal Product Launch Film/raw",
      projectPath: "projects/CR-2026-001-Seasonal Product Launch Film/project-files",
      previewPath: "projects/CR-2026-001-Seasonal Product Launch Film/proxies/Hero_RoughCut_v2_proxy.mp4",
      finalPath: "projects/CR-2026-001-Seasonal Product Launch Film/exports",
      qcScore: 82,
      verificationResult: "Verified",
      revisionCount: 1,
      firstPass: false,
      captionStatus: "Draft",
      thumbnailStatus: "Ready",
      scheduledAt: datePlus(5),
      publishedUrl: "",
      createdAt: datePlus(-18),
      deadline: datePlus(6)
    },
    {
      id: "VID-0131",
      projectId: "p-1003",
      title: "Podcast launch teaser",
      contentType: "Podcast",
      platform: "YouTube Shorts",
      format: "9:16",
      duration: "30s",
      resolution: "1080x1920",
      aspectRatio: "9:16",
      scriptwriter: "Ken Wong",
      checker: "Sofia Chan",
      verifier: "Maya Noor",
      editor: "Ari Lim",
      qc: "Maya Noor",
      approver: "Maya Noor",
      publisher: "Sofia Chan",
      currentStage: "QC",
      detailedStatus: "Revision Required",
      progress: 68,
      difficulty: 3,
      redFlag: "Red",
      blocker: "Two open subtitle remarks",
      rawPath: "raw/p-1003",
      projectPath: "project-files/p-1003",
      previewPath: "proxies/p-1003/podcast_teaser_proxy.mp4",
      finalPath: "exports/p-1003",
      qcScore: 71,
      verificationResult: "Needs Correction",
      revisionCount: 2,
      firstPass: false,
      captionStatus: "Pending",
      thumbnailStatus: "Needs revision",
      scheduledAt: datePlus(3),
      publishedUrl: "",
      createdAt: datePlus(-9),
      deadline: datePlus(3)
    }
  ],
  qcRemarks: [
    {
      id: "RMK-VID0128-0041",
      projectId: "p-1001",
      videoId: "VID-0128",
      versionId: "as-1",
      createdBy: "Maya Noor",
      category: "Subtitle",
      severity: "Minor",
      timecode: "01:35",
      instruction: "Correct subtitle spelling and keep line break inside safe area.",
      assignedTo: "Ari Lim",
      status: "Open",
      resolutionVersion: "",
      repeated: false,
      createdAt: datePlus(-1)
    },
    {
      id: "RMK-VID0131-0020",
      projectId: "p-1003",
      videoId: "VID-0131",
      versionId: "as-3",
      createdBy: "Maya Noor",
      category: "Audio",
      severity: "Major",
      timecode: "00:12",
      instruction: "Voice level drops under music bed; rebalance mix before approval.",
      assignedTo: "Ken Wong",
      status: "Acknowledged",
      resolutionVersion: "",
      repeated: true,
      createdAt: datePlus(-1)
    }
  ],
  comments: [],
  activity: [],
  assetVersions: []
};

let state = clone(seed);

document.addEventListener("click", onClick);
document.addEventListener("submit", onSubmit);
document.addEventListener("change", onChange);
document.addEventListener("input", onInput);

boot();

async function boot() {
  state = await loadState();
  applyAuthContext();
  render();
}

async function loadState() {
  try {
    const response = await fetch(API_STATE_URL, {
      headers: { Accept: "application/json" }
    });
    if (response.status === 401) {
      window.location.href = "/login";
      return clone(seed);
    }
    if (response.ok) {
      const remoteState = await response.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
      return mergeDefaults(remoteState, clone(seed));
    }
  } catch (error) {
    console.warn("Unable to load database state, falling back to browser storage", error);
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return clone(seed);
    const parsed = JSON.parse(stored);
    return mergeDefaults(parsed, clone(seed));
  } catch (error) {
    console.warn("Unable to load state", error);
    return clone(seed);
  }
}

function mergeDefaults(current, defaults) {
  const merged = { ...defaults, ...current };
  merged.comments = current.comments || defaults.comments || [];
  merged.activity = current.activity || defaults.activity || [];
  merged.assetVersions = current.assetVersions || defaults.assetVersions || [];
  merged.workflowWeightage = current.workflowWeightage || defaults.workflowWeightage || [];
  merged.videos = current.videos || defaults.videos || [];
  merged.qcRemarks = current.qcRemarks || defaults.qcRemarks || [];
  merged.ui = { ...defaults.ui, ...(current.ui || {}) };
  merged.departments = departments;
  merged.projects = safeList(merged.projects).map((project) => ({
    ...project,
    department: normalizeDepartmentName(project.department),
    type: normalizeProjectType(project.type)
  }));
  merged.team = safeList(merged.team).map((personItem) => ({
    ...personItem,
    department: normalizeDepartmentName(personItem.department)
  }));
  if (merged.ui.projectDepartment && merged.ui.projectDepartment !== "All") {
    merged.ui.projectDepartment = normalizeDepartmentName(merged.ui.projectDepartment);
  }
  merged.settings = {
    ...defaults.settings,
    ...(current.settings || {}),
    theme: (current.settings || {}).theme || defaults.settings.theme || "light",
    dashboardWidgets: {
      ...defaults.settings.dashboardWidgets,
      ...((current.settings || {}).dashboardWidgets || {})
    },
    security: {
      ...defaults.settings.security,
      ...((current.settings || {}).security || {})
    }
  };
  return merged;
}

function normalizeDepartmentName(value) {
  return departments[0];
}

function normalizeProjectType(value) {
  const type = String(value || "").trim();
  if (projectTypes.includes(type)) return type;

  const map = {
    Video: "Client Campaign Video",
    Podcast: "Podcast / Long-form Video",
    Design: "Motion / Design Support",
    "Motion Graphics": "Motion / Design Support",
    Photography: "Production Support",
    "Social Media": "Publishing Package",
    Marketing: "Publishing Package",
    Copywriting: "Internal Video",
    Freelancer: "Production Support"
  };

  return map[type] || projectTypes[0];
}

function parseAuthUser() {
  const meta = document.querySelector("meta[name='creative-user']");
  if (!meta?.content) return null;

  try {
    return JSON.parse(meta.content);
  } catch (error) {
    console.warn("Unable to parse signed-in user", error);
    return null;
  }
}

function applyAuthContext() {
  if (!state.ui) state.ui = {};
  if (!AUTH_USER) {
    state.auth = state.auth || null;
    state.ui.currentUser = state.ui.currentUser || "Ari Lim";
    state.ui.currentRole = state.ui.currentRole || "Editor";
    return;
  }

  state.auth = AUTH_USER;
  const userChanged = state.ui.currentUser !== AUTH_USER.name || state.ui.currentRole !== AUTH_USER.role;
  state.ui.currentUser = AUTH_USER.name;
  state.ui.currentRole = AUTH_USER.role;
  if (userChanged || !state.ui.view || !canView(state.ui.view)) {
    state.ui.view = defaultViewForRole();
  }
}

function isAdminRole(role = AUTH_USER?.role || state.ui.currentRole) {
  const normalized = String(role || "").trim().toLowerCase();
  return ["admin", "administrator", "manager", "director", "creative manager", "project manager", "coordinator"].includes(normalized);
}

function defaultViewForRole(role = AUTH_USER?.role || state.ui.currentRole) {
  if (isAdminRole(role)) return "admin";
  if (role === "Client") return "approvals";
  return "editor";
}

function navForRole(role = AUTH_USER?.role || state.ui.currentRole) {
  const adminViews = ["dashboard", "admin", "projects", "videos", "tasks", "qc", "approvals", "assets", "team", "reports", "settings"];
  const editorViews = ["editor", "videos", "tasks", "projects", "qc", "assets", "approvals"];
  const clientViews = ["approvals", "assets"];
  const allowed = isAdminRole(role) ? adminViews : role === "Client" ? clientViews : editorViews;
  return navItems.filter(([id]) => allowed.includes(id));
}

function canView(view, role = AUTH_USER?.role || state.ui.currentRole) {
  return navForRole(role).some(([id]) => id === view);
}

function saveState() {
  applyAuthContext();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(syncState, 250);
}

async function syncState() {
  try {
    const csrf = document.querySelector("meta[name='csrf-token']")?.content || "";
    await fetch(API_STATE_URL, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrf
      },
      body: JSON.stringify(state)
    }).then((response) => {
      if (response.status === 401) window.location.href = "/login";
    });
  } catch (error) {
    console.warn("Unable to sync database state", error);
  }
}

function render() {
  applyAuthContext();
  applyTheme();
  const visibleNav = navForRole();
  if (!canView(state.ui.view)) state.ui.view = defaultViewForRole();
  const viewHtml = safeRenderView();
  document.getElementById("app").innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">FF</div>
          <div class="brand-text">
            <div class="brand-title">FF Creative Hub</div>
            <div class="brand-subtitle">Workflow control</div>
          </div>
        </div>
        <nav class="nav" aria-label="Primary">
          ${visibleNav.map(([id, label, icon]) => `
            <button class="nav-button ${state.ui.view === id ? "active" : ""}" data-action="view" data-view="${id}" title="${escapeHtml(label)}">
              <span class="nav-icon">${icons[icon]}</span>
              <span>${escapeHtml(label)}</span>
            </button>
          `).join("")}
        </nav>
        <div class="sidebar-footer">
          <strong>${escapeHtml(AUTH_USER?.name || "FF Creative Hub")}</strong>
          <span>${escapeHtml(AUTH_USER?.role || "Guest")} | ${escapeHtml(AUTH_USER?.department || "Department")}</span>
          <button class="button compact logout-button" data-action="logout">Logout</button>
        </div>
      </aside>
      <main class="main">
        ${viewHtml}
      </main>
    </div>
  `;
}

function safeRenderView() {
  try {
    return renderView();
  } catch (error) {
    console.error(`Unable to render ${state.ui.view}`, error);
    return `
      ${topbar("View Error", "This workspace could not render because one saved record has incomplete data.", `
        <button class="button" data-action="view" data-view="admin">Admin</button>
        <button class="button" data-action="view" data-view="dashboard">Dashboard</button>
      `)}
      <section class="panel">
        <div class="panel-body">
          ${empty(String(error?.message || error || "Unknown render error"))}
        </div>
      </section>
    `;
  }
}

function renderView() {
  if (!canView(state.ui.view)) {
    return renderAccessDenied();
  }

  if (!isAdminRole()) {
    if (state.ui.view === "projects") return renderMemberProjects();
    if (state.ui.view === "tasks") return renderMemberTasks();
    if (state.ui.view === "assets") return renderMemberAssets();
  }

  const renderers = {
    dashboard: renderDashboard,
    editor: renderEditorWorkspace,
    projects: renderProjects,
    videos: renderVideos,
    tasks: renderTasks,
    qc: renderQc,
    approvals: renderApprovals,
    assets: renderAssets,
    team: renderTeam,
    reports: renderReports,
    admin: renderAdminCenter,
    settings: renderSettings
  };
  return (renderers[state.ui.view] || renderDashboard)();
}

function renderAccessDenied() {
  return `
    ${topbar("Access Restricted", "Your current role does not have access to this workspace.")}
    <section class="panel">
      <div class="panel-body">${empty("Use the sidebar to open an available view for your role.")}</div>
    </section>
  `;
}

function topbar(title, copy, actions = "") {
  return `
    <section class="topbar">
      <div>
        <div class="eyebrow">Creative Department Operations</div>
        <h1>${escapeHtml(title)}</h1>
        ${copy ? `<p class="topbar-copy">${escapeHtml(copy)}</p>` : ""}
        ${personaControls()}
      </div>
      ${actions ? `<div class="topbar-actions">${actions}</div>` : ""}
    </section>
  `;
}

function personaControls() {
  return `
    <div class="persona-controls persona-locked" aria-label="Signed in user">
      <div>
        <span>Signed in</span>
        <strong>${escapeHtml(AUTH_USER?.name || state.ui.currentUser || "User")}</strong>
      </div>
      <div>
        <span>Role</span>
        <strong>${escapeHtml(AUTH_USER?.role || state.ui.currentRole || "Editor")}</strong>
      </div>
      ${deviceNotificationButton()}
      <button class="button compact" data-action="toggle-theme">${themeButtonLabel()}</button>
      <button class="button compact" data-action="logout">Logout</button>
    </div>
  `;
}

function themeButtonLabel() {
  return state.settings?.theme === "dark" ? "Light Mode" : "Dark Mode";
}

function applyTheme() {
  document.body.classList.toggle("dark-mode", state.settings?.theme === "dark");
}

function deviceNotificationButton() {
  if (!("Notification" in window)) {
    return "";
  }

  const permission = Notification.permission;
  const enabled = state.ui.deviceNotifications && permission === "granted";
  const label = enabled ? "Device Alerts On" : permission === "denied" ? "Device Alerts Blocked" : "Enable Device Alerts";
  return `<button class="button compact" data-action="device-notifications" ${permission === "denied" ? "disabled" : ""}>${escapeHtml(label)}</button>`;
}

function renderDashboard() {
  const m = metrics();
  const widgets = [
    kpi("activeProjects", m.activeProjects, "Live scopes", "blue"),
    kpi("completedProjects", m.completedProjects, "Archived this cycle", "green"),
    kpi("projectsAtRisk", m.projectsAtRisk, "Need manager attention", "yellow"),
    kpi("overdueProjects", m.overdueProjects, "Past due date", "red"),
    kpi("upcomingDeadlines", m.upcomingDeadlines, "Due in 7 days", "yellow"),
    kpi("teamWorkload", `${m.avgWorkload}%`, "Average team load", "blue"),
    kpi("serverLinks", m.serverLinks, "NAS paths recorded", "green"),
    kpi("proxyQueue", m.proxyQueue, "Preview/proxy work", "blue"),
    kpi("pendingApprovals", m.pendingApprovals, "Awaiting sign off", "yellow"),
    kpi("revisionRequests", m.revisionRequests, "Open revision loops", "red"),
    kpi("publishedContent", m.publishedContent, "Final deliverables", "green"),
    kpi("clientWaiting", m.clientWaiting, "Client-side queue", "yellow")
  ].filter(Boolean).join("");

  return `
    ${topbar("Department Dashboard", "Real-time portfolio status, workload, approvals, deadlines, server-link readiness, and workflow risk.", `
      <button class="button primary" data-action="new-project"><span>+</span> New Project</button>
      <button class="button" data-action="view" data-view="reports">Reports</button>
    `)}
    <div class="app-grid">
      <section class="widget-grid">${widgets}</section>
      <section class="grid-2">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Workflow Health</h2>
              <p>${m.inProduction} projects in active production stages</p>
            </div>
            <button class="button compact" data-action="view" data-view="projects">Open</button>
          </div>
          <div class="panel-body">
            <div class="chart-list">${workflowChart()}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Upcoming Deadlines</h2>
              <p>Projects, approvals, and blocked work</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="list">${deadlineList().slice(0, 6).map(deadlineItem).join("") || empty("No deadline pressure in the next two weeks.")}</div>
          </div>
        </div>
      </section>
      <section class="grid-2">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Team Workload</h2>
              <p>Current allocation by user</p>
            </div>
            <button class="button compact" data-action="view" data-view="team">Staff</button>
          </div>
          <div class="panel-body">
            <div class="chart-list">${state.team.map(personWorkloadBar).join("")}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Announcements</h2>
              <p>Department notices</p>
            </div>
            <button class="icon-button" data-action="new-announcement" title="Add announcement">+</button>
          </div>
          <div class="panel-body">
            <div class="list">${state.announcements.map(announcementItem).join("")}</div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderEditorWorkspace() {
  const user = state.ui.currentUser || state.team[0]?.name || "";
  const tasks = state.tasks
    .filter((taskItem) => taskItem.assignee === user && !["Completed", "Cancelled"].includes(taskItem.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const projects = memberProjects(user);
  const videos = userVideos(user);
  const remarks = userOpenRemarks(user);
  const projectIds = new Set(projects.map((project) => project.id));
  const assets = state.assets.filter((assetItem) => projectIds.has(assetItem.projectId));
  const overdue = tasks.filter((taskItem) => taskItem.dueDate < toISO(new Date())).length;
  const dueSoon = tasks.filter((taskItem) => taskItem.dueDate <= datePlus(3)).length;
  const unread = notificationsFor(user).filter((item) => !item.read).length;

  return `
    ${topbar("My Work", "Assigned work, video progress, QC remarks, server links, and notifications in one workspace.", `
      <button class="button primary" data-action="new-task"><span>+</span> Task</button>
      <button class="button" data-action="view" data-view="videos">Video Tracker</button>
      <button class="button" data-action="view" data-view="qc">QC</button>
      <button class="button" data-action="view" data-view="assets">Server Links</button>
    `)}
    <section class="editor-hero">
      <div>
        <div class="eyebrow">Current focus</div>
        <h2>${escapeHtml(user || "No user selected")}</h2>
        <p>${tasks.length || videos.length || remarks.length ? `${tasks.length} open tasks, ${videos.length} tracked videos, ${remarks.length} open QC remarks.` : "No active work assigned."}</p>
      </div>
      <div class="editor-stats">
        ${summaryCard("Open", tasks.length, "Assigned tasks")}
        ${summaryCard("Due Soon", dueSoon, "Next 3 days")}
        ${summaryCard("QC", remarks.length, "Open remarks")}
        ${summaryCard("Videos", videos.length, "Tracked")}
        ${summaryCard("Unread", unread, "Notifications")}
      </div>
    </section>
    <section class="quick-actions">
      <button class="quick-action" data-action="view" data-view="projects">
        <strong>${projects.length}</strong>
        <span>Projects</span>
      </button>
      <button class="quick-action" data-action="view" data-view="videos">
        <strong>${videos.filter((video) => ["Red", "Critical"].includes(video.redFlag)).length}</strong>
        <span>Red Flags</span>
      </button>
      <button class="quick-action" data-action="view" data-view="qc">
        <strong>${remarks.filter((remark) => ["Major", "Critical"].includes(remark.severity)).length}</strong>
        <span>Major QC</span>
      </button>
      <button class="quick-action" data-action="view" data-view="assets">
        <strong>${assets.length}</strong>
        <span>NAS Links</span>
      </button>
    </section>
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Focus Queue</h2>
            <p>Ordered by deadline and handoff risk</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="editor-task-list">${tasks.map(editorTaskCard).join("") || empty("Nothing assigned right now.")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Notifications</h2>
            <p>Progress, approvals, revisions</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${notificationsFor(user).map(notificationItem).join("") || empty("No notifications for this user.")}</div>
        </div>
      </div>
    </section>
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>My Video Tracker</h2>
            <p>Current stage, red flag, QC score, and server references</p>
          </div>
          <button class="button compact" data-action="view" data-view="videos">Open</button>
        </div>
        <div class="panel-body">
          <div class="list">${videos.slice(0, 4).map(userVideoCard).join("") || empty("No videos assigned to this user.")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>QC Remarks</h2>
            <p>Corrections assigned to you or created by you</p>
          </div>
          <button class="button compact" data-action="view" data-view="qc">Open</button>
        </div>
        <div class="panel-body">
          <div class="list">${remarks.slice(0, 5).map(userRemarkCard).join("") || empty("No open QC remarks.")}</div>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Project Server Links</h2>
          <p>NAS paths for your current projects</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="server-link-grid">${projects.slice(0, 4).map(userServerLinkCard).join("") || empty("No server paths are linked yet.")}</div>
      </div>
    </section>
  `;
}

function userVideoCard(video) {
  const project = projectById(video.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(video.title)}</div>
          <div class="item-meta">${escapeHtml(project?.code || video.id)} | ${escapeHtml(video.currentStage)} | ${weightedVideoProgress(video)}%</div>
        </div>
        ${pill(video.redFlag)}
      </div>
      <div class="progress"><span style="--value:${weightedVideoProgress(video)}%"></span></div>
      <div class="item-meta">
        <span>QC ${escapeHtml(video.qcScore || 0)}%</span>
        <span>${escapeHtml(video.blocker || "No blocker")}</span>
      </div>
    </article>
  `;
}

function userRemarkCard(remark) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(remark.category)} | ${escapeHtml(remark.timecode || "No timecode")}</div>
          <div class="item-meta">${escapeHtml(remark.videoId)} | ${escapeHtml(remark.status)}</div>
        </div>
        ${pill(remark.severity)}
      </div>
      <p class="muted small">${escapeHtml(remark.instruction)}</p>
    </article>
  `;
}

function userServerLinkCard(project) {
  const assets = state.assets.filter((assetItem) => assetItem.projectId === project.id);
  return `
    <article class="server-link-card">
      <div class="item-title">${escapeHtml(project.code)}</div>
      <div class="item-meta">${escapeHtml(project.name)}</div>
      <div class="detail-grid">
        ${detail("Folder", project.nasFolder || "Not created")}
        ${detail("Server Links", assets.length)}
        ${detail("Preview", assets.find((assetItem) => assetItem.proxyPath)?.proxyPath || "No proxy linked")}
      </div>
      <button class="button compact" data-action="select-member-project" data-id="${escapeAttr(project.id)}">Open Project</button>
    </article>
  `;
}

function renderMemberProjects() {
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  const projects = memberProjects(user);
  const selected = projects.find((project) => project.id === state.ui.selectedProjectId) || projects[0];
  return `
    ${topbar("My Projects", "Projects where you are assigned, reviewing, or actively producing work.", `
      <button class="button" data-action="view" data-view="editor">My Work</button>
      <button class="button" data-action="view" data-view="tasks">My Tasks</button>
    `)}
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Assigned Projects</h2>
            <p>${projects.length} visible to ${escapeHtml(user)}</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${projects.map(memberProjectCard).join("") || empty("No projects are assigned to you yet.")}</div>
        </div>
      </div>
      ${selected ? memberProjectDetail(selected, user) : `<div class="panel"><div class="panel-body">${empty("Select a project to view details.")}</div></div>`}
    </section>
  `;
}

function renderMemberTasks() {
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  const tasks = state.tasks
    .filter((taskItem) => taskItem.assignee === user || taskItem.reviewer === user)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return `
    ${topbar("My Tasks", "Your assigned and review tasks, ordered by deadline.", `
      <button class="button" data-action="view" data-view="editor">My Work</button>
      <button class="button" data-action="view" data-view="assets">Server Links</button>
    `)}
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Task List</h2>
          <p>${tasks.length} tasks for ${escapeHtml(user)}</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="editor-task-list">${tasks.map(editorTaskCard).join("") || empty("No tasks are assigned to you yet.")}</div>
      </div>
    </section>
  `;
}

function renderMemberAssets() {
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  const projectIds = new Set(memberProjects(user).map((project) => project.id));
  const assets = state.assets.filter((assetItem) => projectIds.has(assetItem.projectId));
  return `
    ${topbar("My Server Links", "NAS paths, preview links, versions, and final output references attached to your assigned projects.", `
      <button class="button" data-action="view" data-view="editor">My Work</button>
      <button class="button" data-action="new-asset"><span>+</span> Register Link</button>
    `)}
    <section class="asset-grid">${assets.map(assetCard).join("") || empty("No server links are attached to your assigned projects yet.")}</section>
  `;
}

function memberProjectCard(project) {
  const relatedTasks = state.tasks.filter((taskItem) => taskItem.projectId === project.id && (taskItem.assignee === state.ui.currentUser || taskItem.reviewer === state.ui.currentUser));
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(project.name)}</div>
          <div class="item-meta">${escapeHtml(project.code)} | ${escapeHtml(project.client)} | ${escapeHtml(project.workflowStage)}</div>
        </div>
        ${pill(project.status)}
      </div>
      <div class="progress"><span style="--value:${projectProgress(project)}%"></span></div>
      <div class="item-meta">
        <span>${relatedTasks.length} of your tasks</span>
        <span>Deadline ${formatDate(project.deadline)}</span>
      </div>
      <div class="button-row">
        <button class="button compact" data-action="select-member-project" data-id="${escapeAttr(project.id)}">Open Details</button>
        <button class="button compact" data-action="view" data-view="tasks">Tasks</button>
        <button class="button compact" data-action="view" data-view="assets">Server Links</button>
      </div>
    </article>
  `;
}

function memberProjectDetail(project, user) {
  const tasks = state.tasks.filter((taskItem) => taskItem.projectId === project.id && (taskItem.assignee === user || taskItem.reviewer === user));
  const assets = state.assets.filter((assetItem) => assetItem.projectId === project.id);
  return `
    <div class="panel project-detail">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(project.name)}</h2>
          <p>${escapeHtml(project.code)} | ${escapeHtml(project.client)}</p>
        </div>
        ${pill(project.status)}
      </div>
      <div class="panel-body app-grid">
        <div class="progress"><span style="--value:${projectProgress(project)}%"></span></div>
        <div class="detail-grid">
          ${detail("Workflow Stage", project.workflowStage)}
          ${detail("Deadline", formatDate(project.deadline))}
          ${detail("Manager", project.assignedManager)}
          ${detail("Platform", project.platform)}
          ${detail("Your Tasks", tasks.length)}
          ${detail("Server Links", assets.length)}
        </div>
        <div class="list">${tasks.map(editorTaskCard).join("") || empty("No assigned tasks in this project.")}</div>
      </div>
    </div>
  `;
}

function renderAdminCenter() {
  const m = metrics();
  const activeProjects = safeList(state.projects).filter((project) => project.status !== "Completed");
  const riskProjects = safeList(state.projects).filter((project) => project.status === "At Risk" || (project.deadline < toISO(new Date()) && project.status !== "Completed"));
  const blockedTasks = safeList(state.tasks).filter((taskItem) => ["Blocked", "Revision Required"].includes(taskItem.status));
  const pendingApprovals = safeList(state.approvals).filter((approvalItem) => approvalItem.status === "Pending" || approvalItem.status === "Revision Requested");
  const heavyUsers = safeList(state.team).filter((personItem) => personItem.utilization >= 80);
  const flaggedVideos = safeList(state.videos).filter((video) => ["Red", "Critical"].includes(video.redFlag));
  const majorRemarks = safeList(state.qcRemarks).filter((remark) => ["Major", "Critical"].includes(remark.severity) && !["Resolved", "Closed"].includes(remark.status));
  const proxyNeeded = safeList(state.assets).filter((asset) => asset.processingStatus === "proxy_needed");
  const staleTasks = safeList(state.tasks).filter((taskItem) => !["Completed", "Cancelled"].includes(taskItem.status) && (taskItem.lastProgressAt || taskItem.startDate || taskItem.dueDate) < datePlus(-3));
  const urgentItems = [
    ...flaggedVideos.map(adminVideoAlert),
    ...majorRemarks.map(adminRemarkAlert),
    ...riskProjects.map(adminProjectAlert),
    ...blockedTasks.map(adminTaskAlert),
    ...pendingApprovals.map(adminApprovalAlert)
  ];

  return `
    ${topbar("Admin Center", "Department control room for project risk, review queues, storage readiness, and team load.", `
      <button class="button primary" data-action="new-project"><span>+</span> Project</button>
      <button class="button" data-action="new-task"><span>+</span> Task</button>
      <button class="button" data-action="new-announcement"><span>+</span> Announcement</button>
    `)}
    <section class="admin-health">
      ${adminMetric("Active Projects", activeProjects.length, "Live scopes", "blue")}
      ${adminMetric("Needs Attention", urgentItems.length, "Open issues", urgentItems.length ? "red" : "green")}
      ${adminMetric("Approvals", pendingApprovals.length, "Awaiting action", pendingApprovals.length ? "yellow" : "green")}
      ${adminMetric("Team Load", `${m.avgWorkload}%`, "Average utilization", m.avgWorkload >= 80 ? "red" : "blue")}
    </section>
    <section class="admin-actions-grid">
      ${adminAction("Projects", activeProjects.length, "Open register", "projects")}
      ${adminAction("Tasks", blockedTasks.length + staleTasks.length, "Blocked or stale", "tasks")}
      ${adminAction("Videos", flaggedVideos.length, "Red flags", "videos")}
      ${adminAction("QC", majorRemarks.length, "Major remarks", "qc")}
      ${adminAction("Approvals", pendingApprovals.length, "Pending sign-off", "approvals")}
      ${adminAction("Server Links", proxyNeeded.length, "Proxy queue", "assets")}
    </section>
    <section class="admin-command-layout">
      <div class="panel admin-main-panel">
        <div class="panel-header">
          <div>
            <h2>Priority Queue</h2>
            <p>Items that need admin decision or follow-up</p>
          </div>
          <button class="button compact" data-action="view" data-view="reports">Reports</button>
        </div>
        <div class="panel-body">
          <div class="admin-list">
            ${urgentItems.slice(0, 12).join("") || empty("No urgent admin items right now.")}
          </div>
        </div>
      </div>
      <aside class="admin-side-rail">
        <div class="panel">
          <div class="panel-header compact-header">
            <div>
              <h2>Workload</h2>
              <p>${(heavyUsers.length ? heavyUsers : safeList(state.team)).length} people shown</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="chart-list">${(heavyUsers.length ? heavyUsers : safeList(state.team)).slice(0, 6).map(personWorkloadBar).join("")}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header compact-header">
            <div>
              <h2>Storage</h2>
              <p>NAS and proxy readiness</p>
            </div>
            <button class="button compact" data-action="view" data-view="assets">Server Links</button>
          </div>
          <div class="panel-body">
            <div class="admin-list compact-list">${proxyNeeded.slice(0, 4).map(adminAssetAlert).join("") || empty("No proxy work waiting.")}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header compact-header">
            <div>
              <h2>Publishing</h2>
              <p>Scheduled, ready, or missing live links</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="admin-list compact-list">${publishingWatchItems().slice(0, 4).join("") || empty("No publishing blockers right now.")}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header compact-header">
            <div>
              <h2>Notifications</h2>
              <p>Latest department messages</p>
            </div>
          </div>
          <div class="panel-body">
            <div class="admin-list compact-list">${safeList(state.notifications).slice(0, 5).map(notificationItem).join("") || empty("No notifications yet.")}</div>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function adminMetric(title, value, note, tone = "blue") {
  return `
    <article class="admin-metric ${escapeAttr(tone)}">
      <span class="status-dot ${escapeAttr(tone)}"></span>
      <div>
        <strong>${escapeHtml(String(value))}</strong>
        <span>${escapeHtml(title)}</span>
        <small>${escapeHtml(note)}</small>
      </div>
    </article>
  `;
}

function adminAction(title, value, note, view) {
  return `
    <button class="admin-action-card" data-action="view" data-view="${escapeAttr(view)}">
      <strong>${escapeHtml(String(value))}</strong>
      <span>${escapeHtml(title)}</span>
      <small>${escapeHtml(note)}</small>
    </button>
  `;
}

function kpi(key, value, note, tone) {
  if (!state.settings.dashboardWidgets[key]) return "";
  return `
    <article class="card kpi">
      <div class="kpi-head">
        <div class="kpi-label">${escapeHtml(widgetLabels[key])}</div>
        <span class="status-dot ${tone}"></span>
      </div>
      <div>
        <div class="kpi-value">${escapeHtml(String(value))}</div>
        <div class="kpi-note">${escapeHtml(note)}</div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const projects = filteredProjects();
  const selected = getSelectedProject(projects);
  return `
    ${topbar("Projects", "Project intake, campaign metadata, milestones, workflow state, and production notes.", `
      <button class="button primary" data-action="new-project"><span>+</span> New Project</button>
      ${selected ? `<button class="button" data-action="edit-project" data-id="${selected.id}">Edit</button>` : ""}
    `)}
    <section class="filters">
      <div class="field">
        <label for="project-search">Search</label>
        <input id="project-search" data-input="projectSearch" value="${escapeAttr(state.ui.projectSearch)}" placeholder="Project, client, code, tag">
      </div>
      <div class="field">
        <label for="project-status">Status</label>
        <select id="project-status" data-input="projectStatus">${options(["All", "Planning", "In Progress", "Waiting Approval", "At Risk", "Completed"], state.ui.projectStatus)}</select>
      </div>
      <div class="field">
        <label for="project-department">Owner Team</label>
        <select id="project-department" data-input="projectDepartment">${options(["All", ...departments], state.ui.projectDepartment)}</select>
      </div>
      <div class="field">
        <label for="project-count">Projects</label>
        <input id="project-count" value="${projects.length} shown" disabled>
      </div>
    </section>
    <section class="grid-2 project-layout">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Project Register</h2>
            <p>${projects.length} records</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Project</th>
                <th>Owner Team</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(projectRow).join("") || `<tr><td colspan="6">${empty("No projects match the current filters.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      ${selected ? projectDetail(selected) : `<div class="panel"><div class="panel-body">${empty("Select a project to view workflow, brief, tasks, and deliverables.")}</div></div>`}
    </section>
  `;
}

function projectRow(project) {
  const progress = projectProgress(project);
  return `
    <tr class="clickable" data-action="select-project" data-id="${project.id}">
      <td><span class="strong">${escapeHtml(project.code)}</span></td>
      <td>
        <div class="item-title">${escapeHtml(project.name)}</div>
        <div class="item-meta">${escapeHtml(project.client)} | ${escapeHtml(project.type)}</div>
      </td>
      <td>${escapeHtml(project.department)}</td>
      <td>${pill(project.status)}</td>
      <td>${dateStatus(project.deadline)}</td>
      <td>
        <div class="progress" aria-label="${progress}% complete"><span style="--value:${progress}%"></span></div>
      </td>
    </tr>
  `;
}

function projectDetail(project) {
  const relatedTasks = safeList(state.tasks).filter((taskItem) => taskItem.projectId === project.id);
  const projectApprovals = safeList(state.approvals).filter((approvalItem) => approvalItem.projectId === project.id);
  const projectAssets = safeList(state.assets).filter((assetItem) => assetItem.projectId === project.id);
  const projectComments = commentsForProject(project.id);
  const projectActivity = activityForProject(project.id);
  const completedTasks = relatedTasks.filter((taskItem) => taskItem.status === "Completed").length;
  const pendingApprovals = projectApprovals.filter((item) => item.status === "Pending").length;
  return `
    <div class="panel project-detail">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(project.name)}</h2>
          <p>${escapeHtml(project.code)} | ${escapeHtml(project.client)}</p>
        </div>
        <div class="button-row">
          <button class="button compact" data-action="project-folders" data-id="${project.id}">NAS Folders</button>
          <button class="button compact" data-action="comment-project" data-id="${project.id}">Comment</button>
          <button class="button compact" data-action="advance-stage" data-id="${project.id}">Advance</button>
          <button class="button compact" data-action="new-task" data-project="${project.id}">Task</button>
        </div>
      </div>
      <div class="panel-body app-grid">
        <section class="project-snapshot">
          <div>
            <div class="chip-row">
              ${pill(project.priority)}
              ${pill(project.status)}
              <span class="tag">${escapeHtml(project.workflowStage)}</span>
            </div>
            <div class="progress"><span style="--value:${projectProgress(project)}%"></span></div>
          </div>
          <div class="snapshot-grid">
            ${summaryCard("Tasks", relatedTasks.length, `${completedTasks} done`)}
            ${summaryCard("Approvals", projectApprovals.length, `${pendingApprovals} pending`)}
            ${summaryCard("Server Links", projectAssets.length, `${projectAssets.length} linked`)}
          </div>
        </section>
        ${disclosure("Overview", `
          <div class="detail-grid">
            ${detail("Manager", project.assignedManager)}
            ${detail("Team", safeList(project.assignedTeamMembers).join(", "))}
            ${detail("Deadline", formatDate(project.deadline))}
            ${detail("Owner Team", project.department)}
            ${detail("Campaign", project.campaign)}
            ${detail("Platform", project.platform)}
            ${detail("Budget", money(project.budget))}
            ${detail("Hours", `${project.actualHours} / ${project.estimatedHours}`)}
            ${detail("NAS Folder", project.nasFolder || "Not created")}
            ${detail("Access", accessList(project).join(", "))}
          </div>
        `, true)}
        ${disclosure("Workflow", `<div class="workflow-track">${workflowStages.map((stage) => workflowStage(project.workflowStage, stage)).join("")}</div>`)}
        ${disclosure("Brief", `
          <div class="detail-grid">
            ${detail("Objectives", project.objectives)}
            ${detail("Target Audience", project.targetAudience)}
            ${detail("Internal Notes", project.internalNotes)}
            ${detail("Client Notes", project.clientNotes)}
          </div>
          <div class="detail-grid">${renderBrief(project.creativeBrief)}</div>
        `)}
        ${disclosure("Deliverables", `
          <div class="grid-3">
            ${miniList("Milestones", project.milestones)}
            ${miniList("Deliverables", project.deliverables)}
            ${miniList("Tags", project.tags)}
          </div>
        `)}
        ${disclosure("Files And Activity", `
          <section class="grid-2">
            <div>
              <h3>Server References</h3>
              <div class="list">${projectAssets.slice(0, 4).map(projectAssetMini).join("") || empty("No server links registered yet.")}</div>
            </div>
            <div>
              <h3>Activity Timeline</h3>
              <div class="timeline">${projectActivity.slice(0, 8).map(activityItem).join("") || empty("No project activity yet.")}</div>
            </div>
          </section>
        `)}
        ${disclosure("Comments", `<div class="list">${projectComments.slice(0, 6).map(commentItem).join("") || empty("No comments yet.")}</div>`)}
      </div>
    </div>
  `;
}

function projectAssetMini(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="item-meta">${escapeHtml(item.category)} | ${formatBytes(item.fileSize)} | ${escapeHtml(item.storagePath || "No NAS path")}</div>
        </div>
        ${pill(statusLabel(item.processingStatus || "not_started"))}
      </div>
      <div class="button-row">
        <button class="button compact" data-action="preview-asset" data-id="${escapeAttr(item.id)}">Preview</button>
        <button class="button compact" data-action="queue-proxy" data-id="${escapeAttr(item.id)}">Proxy</button>
      </div>
    </article>
  `;
}

function activityItem(item) {
  return `
    <article class="timeline-item">
      <span class="status-dot blue"></span>
      <div>
        <div class="item-title">${escapeHtml(item.summary)}</div>
        <div class="item-meta">${escapeHtml(item.actor || "System")} | ${formatDate(item.createdAt)}</div>
      </div>
    </article>
  `;
}

function commentItem(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.author || "Team")}</div>
          <div class="item-meta">${formatDate(item.createdAt)}${item.mentions?.length ? ` | ${item.mentions.map((mention) => `@${escapeHtml(mention)}`).join(" ")}` : ""}</div>
        </div>
      </div>
      <p class="muted small">${escapeHtml(item.body)}</p>
    </article>
  `;
}

function renderVideos() {
  const term = String(state.ui.videoSearch || "").trim().toLowerCase();
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  const videos = (state.videos || [])
    .filter((video) => isAdminRole() || [video.scriptwriter, video.checker, video.verifier, video.editor, video.qc, video.approver, video.publisher].includes(user))
    .filter((video) => {
      if (!term) return true;
      const project = projectById(video.projectId);
      return [video.id, video.title, video.currentStage, video.detailedStatus, video.redFlag, video.editor, video.qc, project?.name, project?.client]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

  return `
    ${topbar("Video Tracker", "Video-level workflow, PIC ownership, weighted progress, server paths, QC state, red flags, and publishing status.", `
      <button class="button" data-action="view" data-view="qc">QC Queue</button>
      <button class="button" data-action="view" data-view="reports">Analytics</button>
    `)}
    <section class="filters">
      <div class="field">
        <label for="video-search">Search</label>
        <input id="video-search" data-input="videoSearch" value="${escapeAttr(state.ui.videoSearch || "")}" placeholder="Video, project, staff, status, red flag">
      </div>
      <div class="field">
        <label>Videos</label>
        <input value="${videos.length} shown" disabled>
      </div>
      <div class="field">
        <label>Critical</label>
        <input value="${videos.filter((video) => video.redFlag === "Critical").length} flagged" disabled>
      </div>
      <div class="field">
        <label>Average QC</label>
        <input value="${average(videos.map((video) => video.qcScore))}%" disabled>
      </div>
    </section>
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Workflow Queue</h2>
            <p>From briefing to analytics update</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${videos.map(videoTrackerCard).join("") || empty("No videos match the current filter.")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Weightage Model</h2>
            <p>Configurable defaults from the workflow specification</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="chart-list">${(state.workflowWeightage || []).map((item) => reportBar({ label: item.stage, value: item.weight, count: `${item.weight}%` })).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function videoTrackerCard(video) {
  const project = projectById(video.projectId);
  const remarks = remarksForVideo(video.id);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(video.id)} | ${escapeHtml(video.title)}</div>
          <div class="item-meta">${escapeHtml(project?.code || "No project")} | ${escapeHtml(video.contentType)} | Deadline ${formatDate(video.deadline)}</div>
        </div>
        ${pill(video.redFlag)}
      </div>
      <div class="progress"><span style="--value:${weightedVideoProgress(video)}%"></span></div>
      <div class="detail-grid">
        ${detail("Stage", video.currentStage)}
        ${detail("Status", video.detailedStatus)}
        ${detail("Editor", video.editor)}
        ${detail("QC", video.qc)}
        ${detail("Approver", video.approver)}
        ${detail("Difficulty", `${video.difficulty} points`)}
        ${detail("QC Score", `${video.qcScore}%`)}
        ${detail("Open Remarks", remarks.filter((remark) => !["Closed", "Resolved"].includes(remark.status)).length)}
        ${detail("Raw", video.rawPath)}
        ${detail("Preview", video.previewPath)}
        ${detail("Final", video.finalPath)}
        ${detail("Published URL", video.publishedUrl || "Not published")}
      </div>
      <div class="button-row">
        <button class="button compact" data-action="view" data-view="qc">QC Remarks</button>
        <button class="button compact" data-action="new-qc-remark" data-video="${escapeAttr(video.id)}">Add QC</button>
        <button class="button compact" data-action="select-project" data-id="${escapeAttr(video.projectId)}">Project</button>
      </div>
    </article>
  `;
}

function renderQc() {
  const filter = state.ui.qcFilter || "All";
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  const remarks = (state.qcRemarks || [])
    .filter((remark) => filter === "All" || remark.status === filter || remark.severity === filter)
    .filter((remark) => isAdminRole() || remark.assignedTo === user || remark.createdBy === user);
  return `
    ${topbar("QC / Verification", "Structured checklist decisions, timecode remarks, severity, assigned correction owners, and resolution status.", `
      <button class="button primary" data-action="new-qc-remark"><span>+</span> QC Remark</button>
      <button class="button" data-action="view" data-view="videos">Video Tracker</button>
    `)}
    <section class="filters">
      <div class="field">
        <label for="qc-filter">Filter</label>
        <select id="qc-filter" data-input="qcFilter">${options(["All", "Open", "Acknowledged", "In Progress", "Resolved", "Closed", "Reopened", "Minor", "Moderate", "Major", "Critical"], filter)}</select>
      </div>
      <div class="field">
        <label>Open</label>
        <input value="${(state.qcRemarks || []).filter((remark) => !["Resolved", "Closed"].includes(remark.status)).length} remarks" disabled>
      </div>
      <div class="field">
        <label>Major/Critical</label>
        <input value="${(state.qcRemarks || []).filter((remark) => ["Major", "Critical"].includes(remark.severity)).length} remarks" disabled>
      </div>
      <div class="field">
        <label>Repeated</label>
        <input value="${(state.qcRemarks || []).filter((remark) => remark.repeated).length} issues" disabled>
      </div>
    </section>
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Remarks</h2>
            <p>Script, fact, subtitle, audio, visual, branding, format and compliance issues</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${remarks.map(qcRemarkCard).join("") || empty("No QC remarks match this filter.")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Decision Options</h2>
            <p>Workflow outcomes from the specification</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="grid-3">
            ${["Pass", "Pass with minor correction", "Revision required", "Major revision", "Rejected", "Escalated"].map((decision) => summaryCard(decision, qcDecisionCount(decision), "recorded")).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function qcRemarkCard(remark) {
  const video = (state.videos || []).find((item) => item.id === remark.videoId);
  const project = projectById(remark.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(remark.id)} | ${escapeHtml(remark.category)}</div>
          <div class="item-meta">${escapeHtml(video?.title || remark.videoId)} | ${escapeHtml(project?.code || "No project")} | ${escapeHtml(remark.timecode || "No timecode")}</div>
        </div>
        ${pill(remark.severity)}
      </div>
      <p class="muted small">${escapeHtml(remark.instruction)}</p>
      <div class="detail-grid">
        ${detail("Assigned To", remark.assignedTo)}
        ${detail("Created By", remark.createdBy)}
        ${detail("Status", remark.status)}
        ${detail("Decision", remark.decision || "Pending")}
        ${detail("Resolution Version", remark.resolutionVersion || "Pending")}
        ${detail("Repeated", remark.repeated ? "Yes" : "No")}
        ${detail("Created", formatDate(remark.createdAt))}
      </div>
      <div class="button-row">
        <button class="button compact" data-action="qc-status" data-id="${escapeAttr(remark.id)}" data-status="Acknowledged">Acknowledge</button>
        <button class="button compact" data-action="qc-status" data-id="${escapeAttr(remark.id)}" data-status="Resolved">Mark Fixed</button>
        <button class="button compact" data-action="qc-status" data-id="${escapeAttr(remark.id)}" data-status="Reopened">Reopen</button>
        <button class="button compact" data-action="edit-qc-remark" data-id="${escapeAttr(remark.id)}">Edit</button>
      </div>
    </article>
  `;
}

function renderTasks() {
  const tasks = filteredTasks();
  const statuses = ["Pending", "In Progress", "Waiting Review", "Waiting Approval", "Revision Required", "Blocked", "Completed"];
  return `
    ${topbar("Task Management", "Assignment, review, dependencies, revision count, effort, and deadline status.", `
      <button class="button primary" data-action="new-task"><span>+</span> New Task</button>
    `)}
    <section class="filters">
      <div class="field">
        <label for="task-search">Search</label>
        <input id="task-search" data-input="taskSearch" value="${escapeAttr(state.ui.taskSearch)}" placeholder="Task, project, assignee">
      </div>
      <div class="field">
        <label for="task-status">Status</label>
        <select id="task-status" data-input="taskStatus">${options(["All", ...taskStatuses], state.ui.taskStatus)}</select>
      </div>
      <div class="field">
        <label for="task-count">Tasks</label>
        <input id="task-count" value="${tasks.length} shown" disabled>
      </div>
      <div class="field">
        <label for="task-hours">Hours</label>
        <input id="task-hours" value="${tasks.reduce((sum, item) => sum + Number(item.actualHours || 0), 0)} actual" disabled>
      </div>
    </section>
    <section class="panel">
      <div class="panel-body">
        <div class="kanban">
          ${statuses.map((status) => taskColumn(status, tasks.filter((item) => item.status === status))).join("")}
        </div>
      </div>
    </section>
  `;
}

function taskColumn(status, tasks) {
  return `
    <div class="kanban-column">
      <div class="kanban-title">
        <span>${escapeHtml(status)}</span>
        <span class="tag">${tasks.length}</span>
      </div>
      <div class="kanban-list">
        ${tasks.map(taskCard).join("") || `<div class="empty">No items</div>`}
      </div>
    </div>
  `;
}

function taskCard(taskItem) {
  const project = projectById(taskItem.projectId);
  const progress = taskProgressPercent(taskItem);
  return `
    <article class="task-card">
      <div class="item-head">
        <div>
          <h3>${escapeHtml(taskItem.name)}</h3>
          <div class="item-meta">${escapeHtml(project?.code || "No project")} | ${escapeHtml(taskItem.assignee)}</div>
        </div>
        ${pill(taskItem.priority)}
      </div>
      <div class="item-meta">
        <span>${escapeHtml(taskItem.stage)}</span>
        <span>Due ${formatDate(taskItem.dueDate)}</span>
        <span>${taskItem.actualHours}/${taskItem.estimatedHours}h</span>
        <span>R${taskItem.revisionCount}</span>
      </div>
      <div class="progress"><span style="--value:${progress}%"></span></div>
      <div class="small muted">${progress}% complete</div>
      <div class="task-card-footer">
        <select data-action="task-status" data-id="${taskItem.id}" aria-label="Task status">
          ${options(taskStatuses, taskItem.status)}
        </select>
        <div class="task-actions">
          <button class="button compact primary" data-action="update-progress" data-id="${taskItem.id}">Update</button>
          <button class="button compact" data-action="edit-task" data-id="${taskItem.id}">Edit</button>
          <button class="button compact" data-action="comment-task" data-id="${taskItem.id}">Note</button>
          <button class="button compact" data-action="request-task-revision" data-id="${taskItem.id}">Revision</button>
        </div>
      </div>
    </article>
  `;
}

function editorTaskCard(taskItem) {
  const project = projectById(taskItem.projectId);
  const progress = taskProgressPercent(taskItem);
  return `
    <article class="editor-task-card">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(taskItem.name)}</div>
          <div class="item-meta">${escapeHtml(project?.name || "No project")} | ${escapeHtml(taskItem.stage)} | Due ${formatDate(taskItem.dueDate)}</div>
        </div>
        ${pill(taskItem.status)}
      </div>
      <p class="muted small">${escapeHtml(taskItem.lastProgressNote || taskItem.description || "No notes yet.")}</p>
      <div class="progress"><span style="--value:${progress}%"></span></div>
      <div class="task-progress-row">
        <span class="strong">${progress}%</span>
        <span class="muted small">${escapeHtml(taskItem.actualHours || 0)} / ${escapeHtml(taskItem.estimatedHours || 0)}h</span>
      </div>
      <div class="button-row">
        <button class="button compact primary" data-action="update-progress" data-id="${taskItem.id}">Update Progress</button>
        <button class="button compact" data-action="quick-progress" data-id="${taskItem.id}" data-progress="50">50%</button>
        <button class="button compact" data-action="quick-progress" data-id="${taskItem.id}" data-progress="75">75%</button>
        <button class="button compact" data-action="mark-ready" data-id="${taskItem.id}">Ready Review</button>
        <button class="button compact" data-action="comment-task" data-id="${taskItem.id}">Comment</button>
      </div>
    </article>
  `;
}

function notificationItem(item) {
  return `
    <article class="list-item notification-item ${item.read ? "" : "unread"}">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-meta">${escapeHtml(item.user || "Team")} | ${formatDate(item.createdAt || toISO(new Date()))}</div>
        </div>
        ${item.read ? pill("Read") : pill("Pending")}
      </div>
      <p class="muted small">${escapeHtml(item.message)}</p>
      <div class="button-row">
        <button class="button compact" data-action="view" data-view="${escapeAttr(item.linkView || "dashboard")}">Open</button>
        ${item.read ? "" : `<button class="button compact" data-action="mark-notification-read" data-id="${escapeAttr(item.id)}">Mark Read</button>`}
      </div>
    </article>
  `;
}

function adminVideoAlert(video) {
  const project = projectById(video.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(video.title)}</div>
          <div class="item-meta">${escapeHtml(project?.code || video.id)} | ${escapeHtml(video.currentStage)} | ${escapeHtml(video.blocker || "No blocker")}</div>
        </div>
        ${pill(video.redFlag)}
      </div>
      <div class="progress"><span style="--value:${weightedVideoProgress(video)}%"></span></div>
      <div class="button-row">
        <button class="button compact" data-action="view" data-view="videos">Video Tracker</button>
        <button class="button compact" data-action="select-project" data-id="${escapeAttr(video.projectId)}">Project</button>
      </div>
    </article>
  `;
}

function adminRemarkAlert(remark) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(remark.category)} remark at ${escapeHtml(remark.timecode || "N/A")}</div>
          <div class="item-meta">${escapeHtml(remark.videoId)} | Assigned to ${escapeHtml(remark.assignedTo)} | ${escapeHtml(remark.status)}</div>
        </div>
        ${pill(remark.severity)}
      </div>
      <p class="muted small">${escapeHtml(remark.instruction)}</p>
      <button class="button compact" data-action="view" data-view="qc">QC Queue</button>
    </article>
  `;
}

function adminAssetAlert(asset) {
  const project = projectById(asset.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(asset.name)}</div>
          <div class="item-meta">${escapeHtml(project?.code || "No project")} | ${escapeHtml(asset.storagePath || "No NAS path")}</div>
        </div>
        ${pill(statusLabel(asset.processingStatus || "not_started"))}
      </div>
      <div class="button-row">
        <button class="button compact" data-action="queue-proxy" data-id="${escapeAttr(asset.id)}">Queue Proxy</button>
        <button class="button compact" data-action="preview-asset" data-id="${escapeAttr(asset.id)}">Preview</button>
      </div>
    </article>
  `;
}

function adminProjectAlert(project) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(project.name)}</div>
          <div class="item-meta">${escapeHtml(project.code)} | ${escapeHtml(project.client)} | Deadline ${formatDate(project.deadline)}</div>
        </div>
        ${pill(project.status)}
      </div>
      <button class="button compact" data-action="select-project" data-id="${escapeAttr(project.id)}">Open Project</button>
    </article>
  `;
}

function adminTaskAlert(taskItem) {
  const project = projectById(taskItem.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(taskItem.name)}</div>
          <div class="item-meta">${escapeHtml(project?.code || "Task")} | ${escapeHtml(taskItem.assignee)} | Due ${formatDate(taskItem.dueDate)}</div>
        </div>
        ${pill(taskItem.status)}
      </div>
      <button class="button compact" data-action="update-progress" data-id="${escapeAttr(taskItem.id)}">Update</button>
    </article>
  `;
}

function adminApprovalAlert(item) {
  const project = projectById(item.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.deliverable)}</div>
          <div class="item-meta">${escapeHtml(project?.name || "No project")} | ${escapeHtml(item.level)} | ${escapeHtml(item.approver)}</div>
        </div>
        ${pill(item.status)}
      </div>
      <div class="button-row">
        <button class="button compact" data-action="approval-decision" data-id="${escapeAttr(item.id)}" data-decision="Approved">Approve</button>
        <button class="button compact" data-action="approval-decision" data-id="${escapeAttr(item.id)}" data-decision="Revision Requested">Revision</button>
      </div>
    </article>
  `;
}

function equipmentMiniItem(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.name)}</div>
          <div class="item-meta">${escapeHtml(item.currentUser || "Unassigned")} | Return ${item.returnDate ? formatDate(item.returnDate) : "TBD"}</div>
        </div>
        ${pill(item.availability)}
      </div>
    </article>
  `;
}

function publishingWatchItems() {
  return safeList(state.videos)
    .filter((video) => {
      const stage = String(video.currentStage || "");
      const status = String(video.status || "");
      return ["Final Verification", "Approval", "Ready to Publish", "Publishing", "Published"].some((value) => stage.includes(value) || status.includes(value));
    })
    .map((video) => {
      const project = projectById(video.projectId);
      return `
        <article class="list-item">
          <div class="item-head">
            <div>
              <div class="item-title">${escapeHtml(video.title)}</div>
              <div class="item-meta">${escapeHtml(project?.code || video.id)} | ${escapeHtml(video.status || video.currentStage || "Publishing check")}</div>
            </div>
            ${pill(video.redFlag || "Green")}
          </div>
          <button class="button compact" data-action="view" data-view="videos">Video Tracker</button>
        </article>
      `;
    });
}

function renderApprovals() {
  const pending = state.approvals.filter((item) => item.status !== "Approved");
  return `
    ${topbar("Approval Workflow", "Multi-level approval queue for internal leads, management, and clients.", `
      <button class="button primary" data-action="new-approval"><span>+</span> Approval</button>
    `)}
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Queue</h2>
            <p>${pending.length} active approvals</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${state.approvals.map(approvalItem).join("")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Levels</h2>
            <p>Standard chain</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="workflow-track">${approvalLevels.map((level, index) => `<div class="stage ${index < 2 ? "done" : index === 2 ? "current" : ""}">${escapeHtml(level)}</div>`).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function approvalItem(item) {
  const project = projectById(item.projectId);
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.deliverable)}</div>
          <div class="item-meta">${escapeHtml(project?.name || "No project")} | ${escapeHtml(item.level)} | ${escapeHtml(item.approver)}</div>
        </div>
        ${pill(item.status)}
      </div>
      <p class="muted small">${escapeHtml(item.notes)}</p>
      <div class="item-meta">
        <span>Due ${formatDate(item.dueDate)}</span>
        <span>${safeList(item.comments).length} comments</span>
      </div>
      <div class="button-row">
        <button class="button compact" data-action="approval-decision" data-id="${item.id}" data-decision="Approved">Approve</button>
        <button class="button compact" data-action="approval-decision" data-id="${item.id}" data-decision="Rejected">Reject</button>
        <button class="button compact" data-action="approval-decision" data-id="${item.id}" data-decision="Revision Requested">Revision</button>
      </div>
    </article>
  `;
}

function renderAssets() {
  const term = String(state.ui.assetSearch || "").trim().toLowerCase();
  const assets = safeList(state.assets).filter((item) => {
    if (!term) return true;
    return [item.name, item.format, item.category, item.status, projectById(item.projectId)?.name, ...safeList(item.tags)].join(" ").toLowerCase().includes(term);
  });
  return `
    ${topbar("Server Links", "Tracks NAS folders, preview paths, version history, proxy readiness, final output links, and publishing references.", `
      <button class="button primary" data-action="new-asset"><span>+</span> Register Link</button>
    `)}
    <section class="filters">
      <div class="field">
        <label for="asset-search">Search</label>
        <input id="asset-search" data-input="assetSearch" value="${escapeAttr(state.ui.assetSearch)}" placeholder="Path, file, project, tag, format">
      </div>
      <div class="field">
        <label>Reference Types</label>
        <input value="RAW PROJECT PREVIEW FINAL DOC" disabled>
      </div>
      <div class="field">
        <label>Server Links</label>
        <input value="${assets.length} shown" disabled>
      </div>
      <div class="field">
        <label>Proxy Queue</label>
        <input value="${safeList(state.assets).filter((item) => item.processingStatus === "proxy_needed").length} waiting" disabled>
      </div>
    </section>
    <section class="asset-grid">${assets.map(assetCard).join("") || empty("No server links match the current search.")}</section>
  `;
}

function assetCard(item) {
  const project = projectById(item.projectId);
  const versions = assetVersionsFor(item.id);
  return `
    <article class="asset-card">
      <div class="asset-preview">${assetPreview(item)}</div>
      <div class="asset-body">
        <div class="item-head">
          <div>
            <div class="item-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(project?.code || "No project")} | v${item.version} | ${formatBytes(item.fileSize)}</div>
          </div>
          ${pill(item.status)}
        </div>
        <div class="asset-status-row">
          ${pill(statusLabel(item.uploadStatus || "metadata_only"))}
          ${pill(statusLabel(item.processingStatus || "not_started"))}
          <span class="tag">${versions.length} versions</span>
          <span class="tag">${Number(item.downloads || 0)} path copies</span>
        </div>
        <div class="tag-list">${safeList(item.tags).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="asset-actions">
          <button class="button compact primary" data-action="preview-asset" data-id="${item.id}">Preview</button>
          <button class="button compact" data-action="queue-proxy" data-id="${item.id}">Proxy</button>
          <button class="button compact" data-action="asset-download" data-id="${item.id}">Copy Path</button>
          <button class="button compact" data-action="asset-version" data-id="${item.id}">Version</button>
          <button class="button compact" data-action="comment-asset" data-id="${item.id}">Note</button>
        </div>
        ${disclosure("Storage Paths", `
          <div class="detail-grid">
            ${detail("Storage", item.storageDisk || "nas")}
            ${detail("NAS Path", item.storagePath || "Not linked")}
            ${detail("Proxy", item.proxyPath || "Not queued")}
            ${detail("Preview", item.previewPath || "Not ready")}
          </div>
          ${versions.length ? `<div class="version-strip">${versions.slice(0, 4).map((version) => `<span class="tag">v${version.version} ${formatDate(version.createdAt)}</span>`).join("")}</div>` : ""}
        `)}
      </div>
    </article>
  `;
}

function assetPreview(item) {
  const format = String(item.format || "").toUpperCase();
  const stream = `/api/assets/${encodeURIComponent(item.id)}/stream`;
  const playableVideo = ["MP4", "WEBM", "MOV"].includes(format) && (item.previewPath || item.proxyPath || item.storagePath);
  const image = ["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(format) && (item.previewPath || item.storagePath);
  if (playableVideo) return `<video muted controls preload="metadata" src="${escapeAttr(stream)}"></video>`;
  if (image) return `<img alt="${escapeAttr(item.name)}" src="${escapeAttr(stream)}">`;
  return `<span>${escapeHtml(format || "FILE")}</span>`;
}

function renderEquipment() {
  return `
    ${topbar("Equipment Booking", "Availability, assigned users, maintenance, booking history, warranties, and replacement dates.", `
      <button class="button primary" data-action="new-booking"><span>+</span> Booking</button>
    `)}
    <section class="equipment-grid">
      ${state.equipment.map(equipmentCard).join("")}
    </section>
  `;
}

function equipmentCard(item) {
  return `
    <article class="equipment-card">
      <div class="equipment-body">
        <div class="item-head">
          <div>
            <div class="item-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(item.type)} | ${escapeHtml(item.serialNumber)}</div>
          </div>
          ${pill(item.availability)}
        </div>
        <div class="detail-grid">
          ${detail("Condition", item.condition)}
          ${detail("Current User", item.currentUser || "Unassigned")}
          ${detail("Return", item.returnDate ? formatDate(item.returnDate) : "Available")}
          ${detail("Maintenance", formatDate(item.maintenanceDate))}
          ${detail("Warranty", formatDate(item.warrantyDate))}
          ${detail("Replacement", formatDate(item.replacementDate))}
        </div>
        <div class="button-row">
          <button class="button compact" data-action="book-equipment" data-id="${item.id}">Book</button>
          <button class="button compact" data-action="return-equipment" data-id="${item.id}">Return</button>
        </div>
      </div>
    </article>
  `;
}

function renderCalendar() {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + Number(state.ui.calendarOffset || 0));
  const label = base.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const events = calendarEvents();
  return `
    ${topbar("Calendar", "Project deadlines, publishing schedule, meetings, team leave, bookings, and file approvals.", `
      <button class="button" data-action="calendar-prev">Previous</button>
      <button class="button" data-action="calendar-today">Today</button>
      <button class="button" data-action="calendar-next">Next</button>
    `)}
    <section class="grid-2">
      <div class="panel calendar-panel">
        <div class="panel-header">
          <div>
            <h2>${escapeHtml(label)}</h2>
            <p>${events.length} scheduled items</p>
          </div>
        </div>
        <div class="panel-body">
          ${calendarGrid(base, events)}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Agenda</h2>
            <p>Next scheduled events</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="list">${events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12).map(calendarAgendaItem).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function calendarGrid(base, events) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    days.push(date);
  }
  const heads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `
    <div class="calendar-grid">
      ${heads.map((head) => `<div class="calendar-head">${head}</div>`).join("")}
      ${days.map((day) => {
        const iso = toISO(day);
        const dayEvents = events.filter((event) => event.date === iso);
        return `
          <div class="calendar-day ${day.getMonth() === month ? "" : "off"}">
            <div class="calendar-number">${day.getDate()}</div>
            ${dayEvents.slice(0, 3).map((event) => `<span class="calendar-event ${event.tone}">${escapeHtml(event.title)}</span>`).join("")}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTeam() {
  const workload = Object.fromEntries(state.team.map((personItem) => [personItem.name, assignedTaskHours(personItem.name)]));
  return `
    ${topbar("Staff Management", "Workflow departments, roles, permissions, utilization, and audit ownership.", `
      <button class="button primary" data-action="new-user"><span>+</span> User</button>
    `)}
    <section class="team-grid">
      ${state.team.map((personItem) => personCard(personItem, workload[personItem.name])).join("")}
    </section>
  `;
}

function personCard(personItem, assignedHours) {
  return `
    <article class="person-card">
      <div class="person-body">
        <div class="item-head">
          <div>
            <div class="item-title">${escapeHtml(personItem.name)}</div>
            <div class="item-meta">${escapeHtml(personItem.title)} | ${escapeHtml(personItem.department)}</div>
          </div>
          <span class="tag">${escapeHtml(personItem.role)}</span>
        </div>
        <div class="progress"><span style="--value:${personItem.utilization}%"></span></div>
        <div class="item-meta">
          <span>${personItem.utilization}% utilization</span>
          <span>${assignedHours}h assigned</span>
        </div>
        <div class="tag-list">${personItem.skills.map((skill) => `<span class="tag">${escapeHtml(skill)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderReports() {
  const m = metrics();
  return `
    ${topbar("Reporting", "Production, productivity, approval duration, revisions, utilization, profitability, and deadline compliance.", `
      <button class="button" data-action="export-report" data-format="pdf">PDF</button>
      <button class="button" data-action="export-report" data-format="excel">Excel</button>
      <button class="button" data-action="export-report" data-format="csv">CSV</button>
    `)}
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Department Performance</h2>
            <p>${m.completedProjects} completed, ${m.projectsAtRisk} at risk</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="chart-list">${departmentPerformance().map(reportBar).join("")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Platform Distribution</h2>
            <p>Active output by channel</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="chart-list">${platformDistribution().map(reportBar).join("")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Revision Frequency</h2>
            <p>${m.revisionRequests} open revision requests</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="chart-list">${revisionReport().map(reportBar).join("")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Audit Log</h2>
            <p>${state.audit.length} recorded events</p>
          </div>
        </div>
        <div class="panel-body audit-list">
          <div class="list">${state.audit.map(auditItem).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    ${topbar("Settings", "Admin controls for widgets, workflow stages, permissions, and protected operations.", `
      <button class="button danger" data-action="reset-data">Reset Demo Data</button>
    `)}
    <section class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Dashboard Widgets</h2>
            <p>Administrator configuration</p>
          </div>
        </div>
        <div class="panel-body">
          ${Object.keys(widgetLabels).map((key) => `
            <label class="switch-row">
              <span>${escapeHtml(widgetLabels[key])}</span>
              <input type="checkbox" data-setting="widget" data-key="${key}" ${state.settings.dashboardWidgets[key] ? "checked" : ""}>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Security Controls</h2>
            <p>Role-based access foundation</p>
          </div>
        </div>
        <div class="panel-body">
          ${Object.entries({
            mfa: "Multi-factor authentication",
            sessionTimeout: "Automatic session timeout",
            encryptedStorage: "Encrypted file storage",
            ipRestrictions: "IP access restrictions",
            secureBackups: "Secure backups"
          }).map(([key, label]) => `
            <label class="switch-row">
              <span>${escapeHtml(label)}</span>
              <input type="checkbox" data-setting="security" data-key="${key}" ${state.settings.security[key] ? "checked" : ""}>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Appearance</h2>
            <p>Workspace display mode</p>
          </div>
        </div>
        <div class="panel-body">
          <label class="switch-row">
            <span>Dark mode</span>
            <input type="checkbox" data-setting="theme" data-key="dark" ${state.settings.theme === "dark" ? "checked" : ""}>
          </label>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Workflow Stages</h2>
            <p>${workflowStages.length} configured stages</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="workflow-track">${workflowStages.map((stage) => `<div class="stage">${escapeHtml(stage)}</div>`).join("")}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div>
            <h2>Permissions</h2>
            <p>Current role groups</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="chart-list">
            ${reportBar({ label: "Admin", value: 100, count: "all" })}
            ${reportBar({ label: "Manager", value: 78, count: "projects" })}
            ${reportBar({ label: "Member", value: 58, count: "assigned" })}
            ${reportBar({ label: "Freelancer", value: 36, count: "limited" })}
            ${reportBar({ label: "Client", value: 22, count: "approval" })}
          </div>
        </div>
      </div>
    </section>
  `;
}

async function onClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    if (event.target.classList.contains("modal-backdrop")) closeModal();
    return;
  }
  event.preventDefault();

  const { action } = target.dataset;
  if (action === "view") {
    if (!canView(target.dataset.view)) {
      showWorkflowError(`Your current role cannot open ${target.dataset.view || "this view"}.`);
      return;
    }
    state.ui.view = target.dataset.view;
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (action === "logout") {
    document.getElementById("logout-form")?.submit();
    return;
  }
  if (action === "device-notifications") {
    await requestDeviceNotifications();
    return;
  }
  if (action === "toggle-theme") {
    toggleTheme();
    return;
  }
  if (action === "wizard-next") {
    moveWizard(1);
    return;
  }
  if (action === "wizard-back") {
    moveWizard(-1);
    return;
  }
  if (action === "select-project") {
    state.ui.selectedProjectId = target.dataset.id;
    state.ui.view = "projects";
    saveState();
    render();
    return;
  }
  if (action === "select-member-project") {
    state.ui.selectedProjectId = target.dataset.id;
    state.ui.view = "projects";
    saveState();
    render();
    return;
  }
  if (action === "project-folders") {
    await createProjectFolders(target.dataset.id);
    return;
  }
  if (action === "queue-proxy") {
    await queueProxy(target.dataset.id);
    return;
  }
  if (action === "preview-asset") {
    openAssetPreview(target.dataset.id);
    return;
  }
  if (action === "comment-project") {
    openCommentModal({ projectId: target.dataset.id });
    return;
  }
  if (action === "comment-asset") {
    const asset = state.assets.find((assetItem) => assetItem.id === target.dataset.id);
    if (asset) openCommentModal({ projectId: asset.projectId, assetId: asset.id });
    return;
  }
  if (action === "comment-task") {
    const task = state.tasks.find((taskItem) => taskItem.id === target.dataset.id);
    if (task) openCommentModal({ projectId: task.projectId, taskId: task.id });
    return;
  }
  if (action === "new-project") openProjectModal();
  if (action === "edit-project") openProjectModal(target.dataset.id);
  if (action === "new-task") openTaskModal(null, target.dataset.project || "");
  if (action === "edit-task") openTaskModal(target.dataset.id);
  if (action === "update-progress") openProgressModal(target.dataset.id);
  if (action === "quick-progress") quickProgress(target.dataset.id, Number(target.dataset.progress || 0));
  if (action === "mark-ready") markReadyForReview(target.dataset.id);
  if (action === "advance-stage") advanceStage(target.dataset.id);
  if (action === "request-task-revision") requestTaskRevision(target.dataset.id);
  if (action === "new-qc-remark") openQcRemarkModal("", target.dataset.video || "");
  if (action === "edit-qc-remark") openQcRemarkModal(target.dataset.id);
  if (action === "qc-status") updateQcStatus(target.dataset.id, target.dataset.status);
  if (action === "new-approval") openApprovalModal();
  if (action === "approval-decision") updateApproval(target.dataset.id, target.dataset.decision);
  if (action === "new-asset") openAssetModal();
  if (action === "asset-version") bumpAssetVersion(target.dataset.id);
  if (action === "asset-download") downloadAsset(target.dataset.id);
  if (action === "new-booking") openBookingModal();
  if (action === "book-equipment") openBookingModal(target.dataset.id);
  if (action === "return-equipment") returnEquipment(target.dataset.id);
  if (action === "calendar-prev") moveCalendar(-1);
  if (action === "calendar-next") moveCalendar(1);
  if (action === "calendar-today") moveCalendar(0, true);
  if (action === "new-user") openUserModal();
  if (action === "new-announcement") openAnnouncementModal();
  if (action === "mark-notification-read") markNotificationRead(target.dataset.id);
  if (action === "export-report") exportReport(target.dataset.format);
  if (action === "reset-data") resetData();
  if (action === "close-modal") closeModal();
}

async function onSubmit(event) {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  data.assignedTeamMembers = formData.getAll("assignedTeamMembers");
  data.accessMembers = formData.getAll("accessMembers");
  const formName = form.dataset.form;
  if (formName === "asset") {
    try {
      await saveAsset(data, form);
    } catch (error) {
      showWorkflowError(error);
    }
    return;
  }
  if (formName === "project") saveProject(data);
  if (formName === "task") saveTask(data);
  if (formName === "progress") saveProgress(data);
  if (formName === "qc-remark") saveQcRemark(data);
  if (formName === "approval") saveApproval(data);
  if (formName === "comment") saveComment(data);
  if (formName === "booking") saveBooking(data);
  if (formName === "user") saveUser(data);
  if (formName === "announcement") saveAnnouncement(data);
  closeModal();
  saveState();
  render();
}

function onChange(event) {
  const filter = event.target.closest("[data-input]");
  if (filter) {
    state.ui[filter.dataset.input] = filter.value;
    saveState();
    render();
    return;
  }

  const select = event.target.closest("select[data-action='task-status']");
  if (select) {
    const item = state.tasks.find((taskItem) => taskItem.id === select.dataset.id);
    if (item) {
      item.status = select.value;
      if (select.value === "Completed") item.completionDate = toISO(new Date());
      appendAudit("Task updated", `${item.name} moved to ${select.value}`);
      saveState();
      render();
    }
    return;
  }

  const setting = event.target.closest("[data-setting]");
  if (setting) {
    if (setting.dataset.setting === "widget") {
      state.settings.dashboardWidgets[setting.dataset.key] = setting.checked;
    }
    if (setting.dataset.setting === "security") {
      state.settings.security[setting.dataset.key] = setting.checked;
    }
    if (setting.dataset.setting === "theme") {
      state.settings.theme = setting.checked ? "dark" : "light";
      applyTheme();
    }
    appendAudit("Settings", `${setting.dataset.key} set to ${setting.checked ? "on" : "off"}`);
    saveState();
    render();
  }
}

function onInput(event) {
  const input = event.target.closest("[data-input]");
  if (!input) return;
  state.ui[input.dataset.input] = input.value;
  saveState();
  render();
  const restored = document.querySelector(`[data-input="${input.dataset.input}"]`);
  if (restored) {
    restored.focus();
    if (typeof restored.setSelectionRange === "function") {
      const length = restored.value.length;
      restored.setSelectionRange(length, length);
    }
  }
}

function openProjectModal(id) {
  const existing = state.projects.find((project) => project.id === id);
  const users = userChoices();
  const project = existing || {
    id: "",
    name: "",
    code: nextProjectCode(),
    client: "",
    department: departments[0],
    campaign: "",
    type: projectTypes[0],
    priority: "Medium",
    status: "Planning",
    description: "",
    objectives: "",
    targetAudience: "",
    platform: "",
    budget: 0,
    assignedManager: "",
    assignedTeamMembers: [],
    internalNotes: "",
    clientNotes: "",
    startDate: toISO(new Date()),
    deadline: datePlus(14),
    expectedCompletion: datePlus(12),
    actualCompletion: "",
    estimatedHours: 40,
    actualHours: 0,
    workflowStage: "Content Request",
    tags: [],
    categories: [],
    milestones: [],
    deliverables: [],
    creativeBrief: brief({}),
    nasFolder: "",
    accessMembers: []
  };

  const commonFields = `
    <input type="hidden" name="id" value="${escapeAttr(project.id)}">
    <input type="hidden" name="department" value="Creative Operations">
  `;

  if (!existing) {
    openModal("New Project", `
      <form data-form="project" class="project-wizard" data-wizard-current="0">
        ${commonFields}
        <div class="wizard-progress" aria-label="Project creation steps">
          <span class="active">Basics</span>
          <span>Team</span>
          <span>Brief</span>
          <span>Storage</span>
        </div>

        <section class="wizard-step active" data-step="0">
          <div class="step-header">
            <h3>Project basics</h3>
            <p>Start with the request, client, and content type.</p>
          </div>
          <div class="form-grid">
            ${formField("Project Name", "name", project.name, "text", true)}
            ${formField("Project Code", "code", project.code, "text", true)}
            ${formField("Client", "client", project.client, "text", true)}
            <div class="form-field">
              <label>Owner Team</label>
              <input value="Creative Operations" disabled>
            </div>
            ${formField("Campaign", "campaign", project.campaign)}
            ${selectField("Project Type", "type", projectTypes, project.type)}
            ${selectField("Priority", "priority", ["High", "Medium", "Low"], project.priority)}
            ${selectField("Status", "status", ["Planning", "In Progress", "Waiting Approval", "At Risk", "Completed", "Cancelled"], project.status)}
            ${formField("Platform", "platform", project.platform)}
            ${formField("Budget", "budget", project.budget, "number")}
          </div>
        </section>

        <section class="wizard-step" data-step="1">
          <div class="step-header">
            <h3>Team and template</h3>
            <p>Pick the staff involved, then let the system create the usual production tasks.</p>
          </div>
          <div class="form-grid">
            ${selectField("Project Owner", "assignedManager", users, project.assignedManager)}
            ${selectField("Workflow Template", "workflowTemplate", workflowTemplates, defaultWorkflowTemplate(project.type))}
            ${multiSelectField("Assigned Staff", "assignedTeamMembers", users, safeList(project.assignedTeamMembers))}
            ${multiSelectField("View Access", "accessMembers", users, accessList(project))}
            ${roleAssignmentFields(users)}
          </div>
        </section>

        <section class="wizard-step" data-step="2">
          <div class="step-header">
            <h3>Schedule and brief</h3>
            <p>Give editors enough context to start without hunting through messages.</p>
          </div>
          <div class="form-grid">
            ${formField("Start Date", "startDate", project.startDate, "date")}
            ${formField("Deadline", "deadline", project.deadline, "date")}
            ${formField("Expected Completion", "expectedCompletion", project.expectedCompletion, "date")}
            ${formField("Estimated Hours", "estimatedHours", project.estimatedHours, "number")}
            ${textField("Description", "description", project.description)}
            ${textField("Objectives", "objectives", project.objectives)}
            ${textField("Target Audience", "targetAudience", project.targetAudience)}
          </div>
        </section>

        <section class="wizard-step" data-step="3">
          <div class="step-header">
            <h3>Storage and handoff</h3>
            <p>Finish with deliverables, notes, and the NAS handoff details.</p>
          </div>
          <div class="form-grid">
            ${formField("Deliverables", "deliverables", safeList(project.deliverables).join(", "))}
            ${formField("Tags", "tags", safeList(project.tags).join(", "))}
            ${textField("Internal Notes", "internalNotes", project.internalNotes)}
            ${textField("Client Notes", "clientNotes", project.clientNotes)}
            <div class="handoff-note wide">
              <strong>Next after create</strong>
              <span>Create the project folders, upload or link raw footage on the NAS, then editors work through the auto-generated tasks.</span>
            </div>
          </div>
        </section>

        ${projectWizardFooter()}
      </form>
    `);
    return;
  }

  openModal(existing ? "Edit Project" : "New Project", `
    <form data-form="project">
      ${commonFields}
      <div class="form-grid">
        ${formField("Project Name", "name", project.name, "text", true)}
        ${formField("Project Code", "code", project.code, "text", true)}
        ${formField("Client", "client", project.client, "text", true)}
        <div class="form-field">
          <label>Owner Team</label>
          <input value="Creative Operations" disabled>
        </div>
        ${formField("Campaign", "campaign", project.campaign)}
        ${selectField("Project Type", "type", projectTypes, project.type)}
        ${existing ? "" : selectField("Workflow Template", "workflowTemplate", workflowTemplates, defaultWorkflowTemplate(project.type))}
        ${selectField("Priority", "priority", ["High", "Medium", "Low"], project.priority)}
        ${selectField("Status", "status", ["Planning", "In Progress", "Waiting Approval", "At Risk", "Completed", "Cancelled"], project.status)}
        ${formField("Platform", "platform", project.platform)}
        ${formField("Budget", "budget", project.budget, "number")}
        ${selectField("Project Owner", "assignedManager", users, project.assignedManager)}
        ${multiSelectField("Assigned Staff", "assignedTeamMembers", users, safeList(project.assignedTeamMembers))}
        ${multiSelectField("View Access", "accessMembers", users, accessList(project))}
        ${existing ? "" : roleAssignmentFields(users)}
        ${formField("Start Date", "startDate", project.startDate, "date")}
        ${formField("Deadline", "deadline", project.deadline, "date")}
        ${formField("Expected Completion", "expectedCompletion", project.expectedCompletion, "date")}
        ${formField("Estimated Hours", "estimatedHours", project.estimatedHours, "number")}
        ${textField("Description", "description", project.description)}
        ${textField("Objectives", "objectives", project.objectives)}
        ${textField("Target Audience", "targetAudience", project.targetAudience)}
        ${textField("Internal Notes", "internalNotes", project.internalNotes)}
        ${textField("Client Notes", "clientNotes", project.clientNotes)}
        ${formField("Tags", "tags", safeList(project.tags).join(", "))}
        ${formField("Deliverables", "deliverables", safeList(project.deliverables).join(", "))}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function defaultWorkflowTemplate(projectType) {
  if (projectType === "Short-form Video") return "short-form";
  if (projectType === "Podcast / Long-form Video") return "podcast";
  if (projectType === "Publishing Package") return "publishing-only";
  return "standard-video";
}

function roleAssignmentFields(users) {
  const choices = [["", "Select staff"], ...users];
  const defaults = defaultRoleAssignments();
  return `
    <div class="form-field wide">
      <label>Auto Task Roles</label>
      <div class="role-grid">
        ${selectField("Scriptwriter", "roleScriptwriter", choices, defaults.scriptwriter)}
        ${selectField("Producer / Raw Ready", "roleProducer", choices, defaults.producer)}
        ${selectField("Editor", "roleEditor", choices, defaults.editor)}
        ${selectField("Audio / Sound", "roleAudio", choices, defaults.audio)}
        ${selectField("Designer / Motion", "roleDesigner", choices, defaults.designer)}
        ${selectField("QC", "roleQc", choices, defaults.qc)}
        ${selectField("Final Verifier", "roleVerifier", choices, defaults.verifier)}
        ${selectField("Approver", "roleApprover", choices, defaults.approver)}
        ${selectField("Publisher", "rolePublisher", choices, defaults.publisher)}
      </div>
    </div>
  `;
}

function defaultRoleAssignments() {
  const byRole = (terms) => safeList(state.team).find((personItem) => {
    const profile = `${personItem.role || ""} ${personItem.title || ""} ${safeList(personItem.skills).join(" ")}`.toLowerCase();
    return terms.some((term) => profile.includes(String(term).toLowerCase()));
  })?.name || "";
  return {
    scriptwriter: byRole(["script", "copy"]),
    producer: byRole(["producer", "production", "coordinator", "raw readiness"]),
    editor: byRole(["video editor", "editing"]),
    audio: byRole(["audio", "sound", "mix"]),
    designer: byRole(["designer", "design", "motion"]),
    qc: byRole(["qc", "quality"]),
    verifier: byRole(["verifier", "final verifier", "manager"]),
    approver: byRole(["approver", "manager", "admin"]),
    publisher: byRole(["publisher", "publishing", "coordinator"])
  };
}

function openTaskModal(id, projectId = "") {
  const existing = state.tasks.find((taskItem) => taskItem.id === id);
  const taskItem = existing || {
    id: "",
    projectId: projectId || state.ui.selectedProjectId || state.projects[0]?.id || "",
    name: "",
    description: "",
    priority: "Medium",
    assignee: "",
    reviewer: "",
    dueDate: datePlus(7),
    startDate: toISO(new Date()),
    completionDate: "",
    estimatedHours: 8,
    actualHours: 0,
    checklist: [],
    attachments: [],
    comments: [],
    dependencies: [],
    revisionCount: 0,
    status: "Pending",
    stage: "Planning",
    progressPercent: 0,
    lastProgressNote: "",
    lastProgressAt: ""
  };
  openModal(existing ? "Edit Task" : "New Task", `
    <form data-form="task">
      <input type="hidden" name="id" value="${escapeAttr(taskItem.id)}">
      <div class="form-grid">
        ${formField("Task Name", "name", taskItem.name, "text", true)}
        ${selectField("Project", "projectId", state.projects.map((project) => [project.id, `${project.code} - ${project.name}`]), taskItem.projectId)}
        ${selectField("Stage", "stage", workflowStages, taskItem.stage)}
        ${selectField("Priority", "priority", ["High", "Medium", "Low"], taskItem.priority)}
        ${formField("Assignee", "assignee", taskItem.assignee, "text", true)}
        ${formField("Reviewer", "reviewer", taskItem.reviewer)}
        ${selectField("Status", "status", taskStatuses, taskItem.status)}
        ${formField("Start Date", "startDate", taskItem.startDate, "date")}
        ${formField("Due Date", "dueDate", taskItem.dueDate, "date")}
        ${formField("Estimated Hours", "estimatedHours", taskItem.estimatedHours, "number")}
        ${formField("Actual Hours", "actualHours", taskItem.actualHours, "number")}
        ${formField("Progress %", "progressPercent", taskProgressPercent(taskItem), "number")}
        ${formField("Revision Count", "revisionCount", taskItem.revisionCount, "number")}
        ${textField("Description", "description", taskItem.description)}
        ${formField("Checklist", "checklist", (taskItem.checklist || []).map((item) => item.text || item).join(", "))}
        ${formField("Dependencies", "dependencies", (taskItem.dependencies || []).join(", "))}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openProgressModal(id) {
  const taskItem = state.tasks.find((item) => item.id === id);
  if (!taskItem) return;
  const project = projectById(taskItem.projectId);
  openModal("Update Progress", `
    <form data-form="progress">
      <input type="hidden" name="id" value="${escapeAttr(taskItem.id)}">
      <div class="form-grid">
        <div class="form-field wide">
          <label>Task</label>
          <input value="${escapeAttr(taskItem.name)}" disabled>
        </div>
        <div class="form-field wide">
          <label>Project</label>
          <input value="${escapeAttr(project?.name || "No project")}" disabled>
        </div>
        ${formField("Progress %", "progressPercent", taskProgressPercent(taskItem), "number", true)}
        ${formField("Actual Hours", "actualHours", taskItem.actualHours || 0, "number")}
        ${selectField("Status", "status", ["In Progress", "Waiting Review", "Waiting Approval", "Revision Required", "Blocked", "Completed"], taskItem.status)}
        ${textField("Progress Note", "lastProgressNote", taskItem.lastProgressNote || "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openQcRemarkModal(id = "", videoId = "") {
  const existing = state.qcRemarks.find((remark) => remark.id === id);
  const selectedVideo = (state.videos || []).find((video) => video.id === (existing?.videoId || videoId)) || state.videos?.[0];
  const remark = existing || {
    id: "",
    projectId: selectedVideo?.projectId || state.projects[0]?.id || "",
    videoId: selectedVideo?.id || "",
    versionId: "",
    createdBy: state.ui.currentUser || AUTH_USER?.name || "Current User",
    category: "Visual",
    severity: "Minor",
    timecode: "00:00",
    instruction: "",
    assignedTo: selectedVideo?.editor || "",
    status: "Open",
    decision: "Revision required",
    resolutionVersion: "",
    repeated: false,
    createdAt: toISO(new Date())
  };

  openModal(existing ? "Edit QC Remark" : "New QC Remark", `
    <form data-form="qc-remark">
      <input type="hidden" name="id" value="${escapeAttr(remark.id)}">
      <input type="hidden" name="createdAt" value="${escapeAttr(remark.createdAt)}">
      <div class="form-grid">
        ${selectField("Video", "videoId", (state.videos || []).map((video) => [video.id, `${video.id} - ${video.title}`]), remark.videoId)}
        ${selectField("Category", "category", ["Script", "Fact", "Subtitle", "Audio", "Visual", "Branding", "Format", "Compliance"], remark.category)}
        ${selectField("Severity", "severity", ["Minor", "Moderate", "Major", "Critical"], remark.severity)}
        ${selectField("Status", "status", ["Open", "Acknowledged", "In Progress", "Resolved", "Closed", "Reopened"], remark.status)}
        ${selectField("Decision", "decision", ["Pass", "Pass with minor correction", "Revision required", "Major revision", "Rejected", "Escalated"], remark.decision || "Revision required")}
        ${formField("Timecode", "timecode", remark.timecode || "00:00", "text", true)}
        ${formField("Assigned To", "assignedTo", remark.assignedTo || "", "text", true)}
        ${formField("Resolution Version", "resolutionVersion", remark.resolutionVersion || "", "text")}
        <label class="switch-row wide">
          <span>Repeated issue</span>
          <input type="checkbox" name="repeated" value="1" ${remark.repeated ? "checked" : ""}>
        </label>
        ${textField("Instruction", "instruction", remark.instruction || "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openApprovalModal() {
  openModal("New Approval", `
    <form data-form="approval">
      <div class="form-grid">
        ${selectField("Project", "projectId", state.projects.map((project) => [project.id, `${project.code} - ${project.name}`]), state.ui.selectedProjectId || state.projects[0]?.id)}
        ${formField("Deliverable", "deliverable", "", "text", true)}
        ${selectField("Level", "level", approvalLevels, approvalLevels[0])}
        ${formField("Approver", "approver", "", "text", true)}
        ${selectField("Status", "status", ["Pending", "Approved", "Rejected", "Revision Requested"], "Pending")}
        ${formField("Due Date", "dueDate", datePlus(3), "date")}
        ${textField("Notes", "notes", "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openAssetModal() {
  openModal("Register Server Link", `
    <form data-form="asset">
      <div class="form-grid">
        ${selectField("Project", "projectId", state.projects.map((project) => [project.id, `${project.code} - ${project.name}`]), state.ui.selectedProjectId || state.projects[0]?.id)}
        ${formField("Reference Name", "name", "", "text", false)}
        ${formField("Original Filename", "originalFilename", "", "text", false)}
        ${formField("NAS / Server Path", "storagePath", "\\\\CREATIVE-SERVER\\Client\\Project\\RAW\\file.mov", "text", false)}
        ${formField("File Size GB", "fileSizeGb", "", "number")}
        ${selectField("Reference Type", "category", ["Raw Footage", "Audio", "Project File", "Preview Export", "Final Deliverable", "Script", "Source Document", "Brief", "Thumbnail", "Caption Package"], "Project File")}
        ${selectField("Status", "status", ["Pending", "Approved", "Revision Required", "Waiting Approval"], "Pending")}
        ${selectField("Server Status", "uploadStatus", ["metadata_only", "on_nas", "missing", "needs_verify"], "on_nas")}
        ${selectField("Processing Status", "processingStatus", ["not_started", "proxy_needed", "proxy_processing", "proxy_ready", "proxy_failed", "editing", "review_ready", "final_ready"], "not_started")}
        ${formField("Tags", "tags", "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openCommentModal({ projectId, taskId = "", assetId = "" }) {
  const target = assetId ? state.assets.find((assetItem) => assetItem.id === assetId)?.name : projectById(projectId)?.name;
  openModal("Add Comment", `
    <form data-form="comment">
      <input type="hidden" name="projectId" value="${escapeAttr(projectId)}">
      <input type="hidden" name="taskId" value="${escapeAttr(taskId)}">
      <input type="hidden" name="assetId" value="${escapeAttr(assetId)}">
      <div class="form-grid">
        <div class="form-field wide">
          <label>Target</label>
          <input value="${escapeAttr(target || "Project")}" disabled>
        </div>
        ${textField("Comment", "body", "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openAssetPreview(id) {
  const asset = state.assets.find((assetItem) => assetItem.id === id);
  if (!asset) return;
  const versions = assetVersionsFor(asset.id);
  openModal("Asset Preview", `
    <div class="asset-preview-modal">
      <div class="asset-preview-large">${assetPreview(asset)}</div>
      <div class="detail-grid">
        ${detail("Name", asset.name)}
        ${detail("NAS Path", asset.storagePath || "Not linked")}
        ${detail("Proxy Path", asset.proxyPath || "Not queued")}
        ${detail("Preview Path", asset.previewPath || "Not available")}
        ${detail("Server Status", statusLabel(asset.uploadStatus))}
        ${detail("Processing", statusLabel(asset.processingStatus))}
        ${detail("Size", formatBytes(asset.fileSize))}
        ${detail("Versions", versions.length)}
      </div>
      <div class="list">${versions.map((version) => `
        <article class="list-item">
          <div class="item-head">
            <div>
              <div class="item-title">Version ${version.version}</div>
              <div class="item-meta">${escapeHtml(version.createdBy || "Team")} | ${formatDate(version.createdAt)} | ${formatBytes(version.fileSize)}</div>
            </div>
          </div>
          <p class="muted small">${escapeHtml(version.storagePath || asset.storagePath || "")}</p>
        </article>
      `).join("") || empty("No versions recorded yet.")}</div>
    </div>
  `);
}

function openBookingModal(id = "") {
  const item = state.equipment.find((equipmentItem) => equipmentItem.id === id);
  openModal("Equipment Booking", `
    <form data-form="booking">
      <div class="form-grid">
        ${selectField("Equipment", "id", state.equipment.map((equipmentItem) => [equipmentItem.id, `${equipmentItem.name} - ${equipmentItem.availability}`]), item?.id || state.equipment[0]?.id)}
        ${formField("Current User", "currentUser", item?.currentUser || "", "text", true)}
        ${selectField("Availability", "availability", ["Available", "Booked", "In Use", "Unavailable"], item?.availability || "Booked")}
        ${formField("Return Date", "returnDate", item?.returnDate || datePlus(3), "date")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openUserModal() {
  openModal("New User", `
    <form data-form="user">
      <div class="form-grid">
        ${formField("Name", "name", "", "text", true)}
        ${formField("Email", "email", "", "email", true)}
        ${formField("Temporary Password", "password", "password", "text", true)}
        ${formField("Title", "title", "", "text", true)}
        ${selectField("Department", "department", departments, departments[0])}
        ${selectField("Role", "role", ["Director", "Creative Manager", "Project Manager", "Coordinator", "Scriptwriter", "Script Checker", "Researcher", "Verifier", "Video Editor", "Graphic Designer", "QC", "Final Verifier", "Approver", "Publisher", "Admin", "Manager", "Member", "Freelancer", "Limited", "Client"], "Member")}
        ${formField("Utilization", "utilization", 50, "number")}
        ${formField("Skills", "skills", "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openAnnouncementModal() {
  openModal("Announcement", `
    <form data-form="announcement">
      <div class="form-grid">
        ${formField("Title", "title", "", "text", true)}
        ${formField("Owner", "owner", "", "text", true)}
        ${formField("Date", "date", toISO(new Date()), "date")}
        ${textField("Body", "body", "")}
      </div>
      ${modalFooter()}
    </form>
  `);
}

function openModal(title, body) {
  document.getElementById("modal-root").innerHTML = `
    <div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button class="icon-button" data-action="close-modal" title="Close">x</button>
        </div>
        <div class="modal-body">${body}</div>
      </section>
    </div>
  `;
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function moveWizard(direction) {
  const form = document.querySelector(".project-wizard");
  if (!form) return;

  const steps = [...form.querySelectorAll(".wizard-step")];
  if (!steps.length) return;

  const current = Number(form.dataset.wizardCurrent || 0);
  const next = clamp(current + direction, 0, steps.length - 1);
  form.dataset.wizardCurrent = String(next);

  steps.forEach((step, index) => {
    step.classList.toggle("active", index === next);
  });

  form.querySelectorAll(".wizard-progress span").forEach((item, index) => {
    item.classList.toggle("active", index === next);
    item.classList.toggle("done", index < next);
  });

  const backButton = form.querySelector("[data-action='wizard-back']");
  const nextButton = form.querySelector("[data-action='wizard-next']");
  const submitButton = form.querySelector("[data-wizard-submit]");
  if (backButton) backButton.disabled = next === 0;
  if (nextButton) nextButton.hidden = next === steps.length - 1;
  if (submitButton) submitButton.hidden = next !== steps.length - 1;
}

function saveProject(data) {
  const id = data.id || makeId("p");
  const roles = projectRoleAssignments(data);
  const assignedManager = data.assignedManager.trim();
  const assignedTeamMembers = uniqueList([...listFromField(data.assignedTeamMembers), ...Object.values(roles)]);
  const accessMembers = listFromField(data.accessMembers);
  const project = {
    id,
    name: data.name.trim(),
    code: data.code.trim(),
    client: data.client.trim(),
    department: data.department,
    campaign: data.campaign.trim(),
    type: data.type,
    priority: data.priority,
    status: data.status,
    description: data.description.trim(),
    objectives: data.objectives.trim(),
    targetAudience: data.targetAudience.trim(),
    platform: data.platform.trim(),
    budget: Number(data.budget || 0),
    assignedManager,
    assignedTeamMembers,
    internalNotes: data.internalNotes.trim(),
    clientNotes: data.clientNotes.trim(),
    startDate: data.startDate,
    deadline: data.deadline,
    expectedCompletion: data.expectedCompletion,
    actualCompletion: data.status === "Completed" ? (data.actualCompletion || toISO(new Date())) : "",
    estimatedHours: Number(data.estimatedHours || 0),
    actualHours: projectHours(id),
    workflowStage: data.status === "Completed" ? "Archive" : "Content Request",
    tags: splitList(data.tags),
    categories: [],
    milestones: [],
    deliverables: splitList(data.deliverables),
    creativeBrief: brief({ businessObjectives: data.objectives, targetAudience: data.targetAudience }),
    nasFolder: "",
    accessMembers: accessMembers.length ? uniqueList([...accessMembers, ...assignedTeamMembers, assignedManager]) : uniqueList([...assignedTeamMembers, assignedManager])
  };
  const index = state.projects.findIndex((item) => item.id === id);
  if (index >= 0) {
    const previous = state.projects[index];
    project.workflowStage = data.status === "Completed" ? "Archive" : previous.workflowStage;
    project.actualCompletion = data.status === "Completed" ? (previous.actualCompletion || toISO(new Date())) : "";
    project.creativeBrief = { ...previous.creativeBrief, ...project.creativeBrief };
    project.milestones = previous.milestones;
    project.categories = previous.categories;
    project.nasFolder = previous.nasFolder || project.nasFolder;
    state.projects[index] = project;
    recordActivity(id, "project_updated", `${project.code} updated`, "project", id);
    appendAudit("Project updated", `${project.code} ${project.name}`);
  } else {
    state.projects.unshift(project);
    createTasksFromTemplate(project, data.workflowTemplate, roles);
    state.ui.selectedProjectId = id;
    recordActivity(id, "project_created", `${project.code} created`, "project", id);
    appendAudit("Project created", `${project.code} ${project.name}`);
  }
}

function projectRoleAssignments(data) {
  const owner = data.assignedManager?.trim() || "";
  return {
    owner,
    scriptwriter: data.roleScriptwriter || owner,
    producer: data.roleProducer || owner,
    editor: data.roleEditor || owner,
    audio: data.roleAudio || data.roleEditor || owner,
    designer: data.roleDesigner || data.roleEditor || owner,
    qc: data.roleQc || owner,
    verifier: data.roleVerifier || data.roleQc || owner,
    approver: data.roleApprover || owner,
    publisher: data.rolePublisher || owner,
    checker: data.roleVerifier || data.roleQc || owner
  };
}

function createTasksFromTemplate(project, templateId, roles) {
  const template = workflowTaskTemplates[templateId || "none"] || [];
  if (!template.length) return;

  const start = new Date(project.startDate || toISO(new Date()));
  const tasks = template.map((item, index) => {
    const assignee = roles[item.role] || roles.owner || project.assignedManager || "";
    const reviewer = roles[item.reviewer] || roles.owner || project.assignedManager || "";
    return {
      id: makeId("t"),
      projectId: project.id,
      name: item.name,
      description: `${item.name} for ${project.code}.`,
      priority: project.priority,
      assignee,
      reviewer,
      dueDate: dateFrom(start, item.dueOffset),
      startDate: dateFrom(start, Math.max(0, item.dueOffset - 2)),
      completionDate: "",
      estimatedHours: item.hours,
      actualHours: 0,
      checklist: [],
      attachments: [],
      comments: [],
      dependencies: index ? [template[index - 1].name] : [],
      revisionCount: 0,
      status: index === 0 ? "In Progress" : "Pending",
      stage: item.stage,
      progressPercent: 0,
      lastProgressNote: "",
      lastProgressAt: ""
    };
  });

  state.tasks.unshift(...tasks);
  recordActivity(project.id, "tasks_generated", `${tasks.length} tasks generated from workflow template`, "project", project.id);
  appendAudit("Template tasks created", `${project.code}: ${tasks.length} tasks`);
}

function saveTask(data) {
  const id = data.id || makeId("t");
  const previous = state.tasks.find((item) => item.id === id);
  const taskItem = {
    id,
    projectId: data.projectId,
    name: data.name.trim(),
    description: data.description.trim(),
    priority: data.priority,
    assignee: data.assignee.trim(),
    reviewer: data.reviewer.trim(),
    dueDate: data.dueDate,
    startDate: data.startDate,
    completionDate: data.status === "Completed" ? toISO(new Date()) : "",
    estimatedHours: Number(data.estimatedHours || 0),
    actualHours: Number(data.actualHours || 0),
    checklist: splitList(data.checklist).map((text) => ({ text, done: false })),
    attachments: [],
    comments: [],
    dependencies: splitList(data.dependencies),
    revisionCount: Number(data.revisionCount || 0),
    status: data.status,
    stage: data.stage,
    progressPercent: clamp(Number(data.progressPercent || 0), 0, 100),
    lastProgressNote: previous?.lastProgressNote || "",
    lastProgressAt: previous?.lastProgressAt || ""
  };
  const index = state.tasks.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.tasks[index] = taskItem;
    recordActivity(taskItem.projectId, "task_updated", `${taskItem.name} updated`, "task", taskItem.id);
    appendAudit("Task updated", taskItem.name);
  } else {
    state.tasks.unshift(taskItem);
    recordActivity(taskItem.projectId, "task_created", `${taskItem.name} assigned to ${taskItem.assignee}`, "task", taskItem.id);
    appendAudit("Task created", taskItem.name);
  }
  if (previous && previous.projectId !== taskItem.projectId) syncProjectHours(previous.projectId);
  syncProjectHours(taskItem.projectId);
}

function saveProgress(data) {
  const taskItem = state.tasks.find((item) => item.id === data.id);
  if (!taskItem) return;
  const previousProgress = taskProgressPercent(taskItem);
  taskItem.progressPercent = clamp(Number(data.progressPercent || 0), 0, 100);
  taskItem.actualHours = Number(data.actualHours || taskItem.actualHours || 0);
  taskItem.status = data.status;
  taskItem.lastProgressNote = data.lastProgressNote.trim();
  taskItem.lastProgressAt = toISO(new Date());
  if (taskItem.status === "Completed") taskItem.completionDate = toISO(new Date());
  syncProjectHours(taskItem.projectId);
  recordActivity(taskItem.projectId, "progress", `${taskItem.name} moved from ${previousProgress}% to ${taskItem.progressPercent}%`, "task", taskItem.id, {
    from: previousProgress,
    to: taskItem.progressPercent
  });
  appendAudit("Progress updated", `${taskItem.name}: ${previousProgress}% to ${taskItem.progressPercent}%`);
  createProgressNotification(taskItem);
}

function saveQcRemark(data) {
  const video = (state.videos || []).find((item) => item.id === data.videoId);
  if (!video) return;

  const id = data.id || `RMK-${video.id}-${String(Date.now()).slice(-4)}`;
  const existing = state.qcRemarks.find((remark) => remark.id === id);
  const remark = {
    id,
    projectId: video.projectId,
    videoId: video.id,
    versionId: existing?.versionId || data.versionId || "",
    createdBy: existing?.createdBy || state.ui.currentUser || AUTH_USER?.name || "Current User",
    category: data.category,
    severity: data.severity,
    timecode: normalizeTimecode(data.timecode),
    instruction: data.instruction.trim(),
    assignedTo: data.assignedTo.trim(),
    status: data.status,
    decision: data.decision,
    resolutionVersion: data.resolutionVersion.trim(),
    repeated: data.repeated === "1",
    createdAt: data.createdAt || existing?.createdAt || toISO(new Date())
  };

  if (!remark.instruction) return;

  const index = state.qcRemarks.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.qcRemarks[index] = remark;
    recordActivity(remark.projectId, "qc_updated", `${remark.id} updated at ${remark.timecode}`, "qc", remark.id);
    appendAudit("QC updated", `${remark.id}: ${remark.status}`);
  } else {
    state.qcRemarks.unshift(remark);
    video.revisionCount = Number(video.revisionCount || 0) + 1;
    if (["Major", "Critical"].includes(remark.severity)) {
      video.redFlag = remark.severity === "Critical" ? "Critical" : "Red";
      video.blocker = remark.instruction;
    }
    recordActivity(remark.projectId, "qc_created", `${remark.category} remark added at ${remark.timecode}`, "qc", remark.id);
    appendAudit("QC remark created", `${remark.id}: ${remark.assignedTo}`);
  }

  addNotification({
    user: remark.assignedTo,
    type: "qc",
    title: "QC remark assigned",
    message: `${video.title}: ${remark.category} issue at ${remark.timecode}.`,
    linkView: "qc"
  });
}

function saveApproval(data) {
  state.approvals.unshift({
    id: makeId("a"),
    projectId: data.projectId,
    deliverable: data.deliverable.trim(),
    level: data.level,
    approver: data.approver.trim(),
    status: data.status,
    dueDate: data.dueDate,
    notes: data.notes.trim(),
    comments: []
  });
  recordActivity(data.projectId, "approval_created", `${data.deliverable} sent to ${data.approver}`, "approval", data.deliverable);
  appendAudit("Approval created", data.deliverable);
}

async function saveAsset(data, form) {
  const file = form.querySelector("input[type='file']")?.files?.[0];
  if (file) {
    await uploadChunkedAsset(data, form, file);
    return;
  }

  const rawName = data.name.trim() || data.originalFilename.trim() || "Untitled asset";
  const extension = rawName.match(/\.([^.]+)$/);
  const format = extension ? extension[1].toUpperCase() : "FILE";
  const fileSize = Math.round(Number(data.fileSizeGb || 0) * 1024 * 1024 * 1024);
  const assetId = makeId("as");
  const versionRecord = {
    id: makeId("av"),
    assetId,
    version: 1,
    storagePath: normalizeNasPath(data.storagePath),
    createdBy: state.ui.currentUser || "Current User",
    note: "Registered existing NAS file",
    fileSize,
    createdAt: toISO(new Date())
  };
  state.assets.unshift({
    id: assetId,
    name: rawName,
    format,
    projectId: data.projectId,
    category: data.category,
    storageDisk: "nas",
    storagePath: normalizeNasPath(data.storagePath),
    originalFilename: data.originalFilename.trim() || rawName,
    fileSize,
    mimeType: "",
    uploadStatus: data.uploadStatus,
    processingStatus: data.processingStatus,
    proxyPath: proxyPathFor(data.projectId, rawName),
    previewPath: "",
    version: 1,
    versionHistory: [versionRecord],
    tags: splitList(data.tags),
    status: data.status,
    downloads: 0,
    usageHistory: [],
    createdAt: toISO(new Date())
  });
  state.assetVersions = state.assetVersions || [];
  state.assetVersions.unshift(versionRecord);
  recordActivity(data.projectId, "asset_registered", `Registered ${rawName} on NAS`, "asset", assetId);
  appendAudit("File registered", rawName);
  closeModal();
  saveState();
  render();
}

async function uploadChunkedAsset(data, form, file) {
  const progressBox = form.querySelector("[data-upload-progress]");
  const progressBar = progressBox?.querySelector(".progress span");
  const label = form.querySelector("[data-upload-label]");
  const submit = form.querySelector("button[type='submit']");
  if (progressBox) progressBox.hidden = false;
  if (submit) submit.disabled = true;

  const project = projectById(data.projectId);
  const start = await apiPost(API_UPLOAD_START_URL, {
    projectId: data.projectId,
    filename: data.originalFilename.trim() || file.name,
    totalSize: file.size,
    mimeType: file.type,
    category: data.category,
    storagePath: normalizeNasPath(data.storagePath) || `${project?.nasFolder || `projects/${project?.code || data.projectId}`}/raw/${file.name}`
  });

  const chunkSize = start.chunkSize || (8 * 1024 * 1024);
  for (let index = 0; index < start.totalChunks; index += 1) {
    const formData = new FormData();
    formData.append("index", String(index));
    formData.append("chunk", file.slice(index * chunkSize, Math.min(file.size, (index + 1) * chunkSize)), file.name);

    const response = await fetch(`/api/assets/chunked/${encodeURIComponent(start.uploadId)}/chunk`, {
      method: "POST",
      headers: csrfHeaders(),
      body: formData
    });
    if (!response.ok) throw new Error(await response.text());
    const progress = await response.json();
    if (progressBar) progressBar.style.setProperty("--value", `${progress.progress}%`);
    if (label) label.textContent = `Uploading ${file.name}: ${progress.progress}%`;
  }

  if (label) label.textContent = "Finalizing upload on NAS";
  const complete = await apiPost(`/api/assets/chunked/${encodeURIComponent(start.uploadId)}/complete`, {});
  state = mergeDefaults(await loadState(), clone(seed));
  if (complete.asset && !state.assets.some((assetItem) => assetItem.id === complete.asset.id)) {
    state.assets.unshift(complete.asset);
  }
  closeModal();
  render();
}

function saveBooking(data) {
  const item = state.equipment.find((equipmentItem) => equipmentItem.id === data.id);
  if (!item) return;
  item.currentUser = data.currentUser.trim();
  item.availability = data.availability;
  item.returnDate = data.returnDate;
  item.bookingHistory = item.bookingHistory || [];
  item.bookingHistory.unshift({
    user: item.currentUser,
    bookedAt: toISO(new Date()),
    returnDate: item.returnDate
  });
  appendAudit("Equipment booked", `${item.name} by ${item.currentUser}`);
}

function saveUser(data) {
  state.team.push({
    id: makeId("u"),
    name: data.name.trim(),
    email: data.email.trim(),
    password: data.password || "password",
    title: data.title.trim(),
    department: data.department,
    role: data.role,
    utilization: clamp(Number(data.utilization || 0), 0, 100),
    skills: splitList(data.skills)
  });
  appendAudit("User created", data.name);
}

function saveAnnouncement(data) {
  state.announcements.unshift({
    id: makeId("n"),
    title: data.title.trim(),
    body: data.body.trim(),
    date: data.date,
    owner: data.owner.trim()
  });
  appendAudit("Announcement posted", data.title);
}

async function createProjectFolders(projectId) {
  try {
    const result = await apiPost(API_PROJECT_FOLDERS_URL, { projectId });
    const project = projectById(projectId);
    if (project) {
      project.nasFolder = result.folder;
      recordActivity(projectId, "folders", `NAS folders created at ${result.folder}`, "project", projectId);
      appendAudit("NAS folders", `${project.code}: ${result.folder}`);
      saveState();
      render();
    }
  } catch (error) {
    showWorkflowError(error);
  }
}

async function queueProxy(assetId) {
  try {
    const result = await apiPost(API_PROXY_QUEUE_URL, { assetId });
    const asset = state.assets.find((assetItem) => assetItem.id === assetId);
    if (!asset) return;
    asset.processingStatus = result.processingStatus || "proxy_needed";
    asset.proxyPath = result.proxyPath || asset.proxyPath || proxyPathFor(asset.projectId, asset.name);
    recordActivity(asset.projectId, "proxy_queued", `Proxy queued for ${asset.name}`, "asset", asset.id);
    addNotification({
      user: projectById(asset.projectId)?.assignedManager || "Admin",
      type: "proxy",
      title: "Proxy queued",
      message: `${asset.name} is queued for proxy generation.`,
      linkView: "assets"
    });
    appendAudit("Proxy queued", asset.name);
    saveState();
    render();
  } catch (error) {
    showWorkflowError(error);
  }
}

function saveComment(data) {
  const projectId = data.projectId;
  const comment = {
    id: makeId("c"),
    projectId,
    taskId: data.taskId || "",
    assetId: data.assetId || "",
    author: state.ui.currentUser || AUTH_USER?.name || "Current User",
    body: data.body.trim(),
    mentions: extractMentions(data.body),
    createdAt: toISO(new Date())
  };
  if (!comment.body) return;
  state.comments = state.comments || [];
  state.comments.unshift(comment);
  const targetType = comment.assetId ? "asset" : comment.taskId ? "task" : "project";
  recordActivity(projectId, "comment", `Comment added by ${comment.author}`, targetType, comment.assetId || comment.taskId || projectId);
  comment.mentions.forEach((mention) => addNotification({
    user: mention,
    type: "mention",
    title: "You were mentioned",
    message: comment.body,
    linkView: "projects"
  }));
}

function recordActivity(projectId, type, summary, targetType = "project", targetId = projectId, metadata = {}) {
  state.activity = state.activity || [];
  state.activity.unshift({
    id: makeId("act"),
    projectId,
    actor: state.ui.currentUser || AUTH_USER?.name || "System",
    type,
    summary,
    targetType,
    targetId,
    metadata,
    createdAt: toISO(new Date())
  });
}

async function apiPost(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...csrfHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function csrfHeaders() {
  const csrf = document.querySelector("meta[name='csrf-token']")?.content || "";
  return csrf ? { "X-CSRF-TOKEN": csrf } : {};
}

function showWorkflowError(error) {
  console.error(error);
  const message = String(error?.message || error || "The workflow action failed.");
  window.alert(message.length > 300 ? `${message.slice(0, 300)}...` : message);
}

function advanceStage(projectId) {
  const project = projectById(projectId);
  if (!project) return;
  const index = workflowStages.indexOf(project.workflowStage);
  const next = workflowStages[Math.min(index + 1, workflowStages.length - 1)];
  project.workflowStage = next;
  if (next === "Archive") {
    project.status = "Completed";
    project.actualCompletion = toISO(new Date());
  } else if (["Client Approval", "Management Approval", "Final Review"].includes(next)) {
    project.status = "Waiting Approval";
  } else {
    project.status = "In Progress";
  }
  recordActivity(project.id, "workflow", `${project.code} advanced to ${next}`, "project", project.id);
  appendAudit("Status change", `${project.code} advanced to ${next}`);
  saveState();
  render();
}

function requestTaskRevision(id) {
  const item = state.tasks.find((taskItem) => taskItem.id === id);
  if (!item) return;
  item.revisionCount += 1;
  item.status = "Revision Required";
  recordActivity(item.projectId, "revision", `${item.name} revision requested`, "task", item.id);
  appendAudit("Revision requested", item.name);
  addNotification({
    user: item.assignee,
    type: "revision",
    title: "Revision requested",
    message: `${item.name} needs revision.`,
    linkView: "tasks"
  });
  saveState();
  render();
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  applyTheme();
  appendAudit("Appearance", `${state.settings.theme} mode enabled`);
  saveState();
  render();
}

function updateQcStatus(id, status) {
  const remark = (state.qcRemarks || []).find((item) => item.id === id);
  if (!remark) return;

  const previous = remark.status;
  remark.status = status;
  if (status === "Resolved" && !remark.resolutionVersion) {
    const asset = state.assets.find((assetItem) => assetItem.projectId === remark.projectId);
    remark.resolutionVersion = asset ? `v${asset.version || 1}` : "Current cut";
  }

  const video = (state.videos || []).find((item) => item.id === remark.videoId);
  if (video && status === "Resolved") {
    const open = remarksForVideo(video.id).filter((item) => !["Resolved", "Closed"].includes(item.status)).length;
    video.qcScore = clamp(Number(video.qcScore || 0) + (open <= 1 ? 8 : 3), 0, 100);
    if (open <= 1 && ["Red", "Critical"].includes(video.redFlag)) {
      video.redFlag = "Amber";
      video.blocker = "QC fixes awaiting final verification";
    }
  }

  recordActivity(remark.projectId, "qc_status", `${remark.id} moved from ${previous} to ${status}`, "qc", remark.id);
  appendAudit("QC status", `${remark.id}: ${status}`);
  addNotification({
    user: status === "Resolved" ? remark.createdBy : remark.assignedTo,
    type: "qc",
    title: `QC ${status.toLowerCase()}`,
    message: `${remark.id} at ${remark.timecode || "no timecode"} is now ${status}.`,
    linkView: "qc"
  });
  saveState();
  render();
}

function quickProgress(id, progress) {
  const item = state.tasks.find((taskItem) => taskItem.id === id);
  if (!item) return;
  item.progressPercent = clamp(progress, 0, 100);
  item.status = progress >= 100 ? "Completed" : "In Progress";
  item.lastProgressNote = `Updated to ${item.progressPercent}% from My Work.`;
  item.lastProgressAt = toISO(new Date());
  if (item.status === "Completed") item.completionDate = toISO(new Date());
  recordActivity(item.projectId, "progress", `${item.name} quick updated to ${item.progressPercent}%`, "task", item.id);
  appendAudit("Progress updated", `${item.name}: ${item.progressPercent}%`);
  createProgressNotification(item);
  saveState();
  render();
}

function markReadyForReview(id) {
  const item = state.tasks.find((taskItem) => taskItem.id === id);
  if (!item) return;
  item.status = "Waiting Review";
  item.progressPercent = Math.max(taskProgressPercent(item), 90);
  item.lastProgressNote = "Ready for reviewer handoff.";
  item.lastProgressAt = toISO(new Date());
  recordActivity(item.projectId, "review", `${item.name} marked ready for review`, "task", item.id);
  appendAudit("Review handoff", item.name);
  addNotification({
    user: item.reviewer || projectById(item.projectId)?.assignedManager || "Admin",
    type: "review",
    title: "Ready for review",
    message: `${item.assignee} marked ${item.name} ready for review.`,
    linkView: "tasks"
  });
  saveState();
  render();
}

function markNotificationRead(id) {
  const item = (state.notifications || []).find((notification) => notification.id === id);
  if (!item) return;
  item.read = true;
  saveState();
  render();
}

async function requestDeviceNotifications() {
  if (!("Notification" in window)) {
    window.alert("This browser does not support device notifications.");
    return;
  }

  const permission = await Notification.requestPermission();
  state.ui.deviceNotifications = permission === "granted";
  appendAudit("Device alerts", permission === "granted" ? "Enabled" : "Not enabled");
  saveState();
  render();

  if (permission === "granted") {
    sendDeviceNotification({
      title: "FF Creative Hub alerts enabled",
      message: "You will see workflow alerts from this browser session."
    });
  }
}

function createProgressNotification(taskItem) {
  const project = projectById(taskItem.projectId);
  const manager = project?.assignedManager || taskItem.reviewer || "Admin";
  addNotification({
    user: manager,
    type: "editing_progress",
    title: "Editing progress updated",
    message: `${taskItem.assignee} updated ${taskItem.name} to ${taskProgressPercent(taskItem)}%.`,
    linkView: "tasks"
  });
}

function addNotification(notification) {
  state.notifications = state.notifications || [];
  const item = {
    id: makeId("nt"),
    read: false,
    createdAt: toISO(new Date()),
    ...notification
  };
  state.notifications.unshift(item);
  sendDeviceNotification(item);
}

function sendDeviceNotification(item) {
  if (!state.ui.deviceNotifications || !("Notification" in window) || Notification.permission !== "granted") return;
  const user = state.ui.currentUser || AUTH_USER?.name || "";
  if (item.user && item.user !== user && item.user !== "Admin") return;

  const now = Date.now();
  if (now - lastDeviceNotificationAt < 1000) return;
  lastDeviceNotificationAt = now;

  new Notification(item.title || "FF Creative Hub", {
    body: item.message || "There is a workflow update.",
    tag: item.id || item.type || "creative-hub",
    silent: false
  });
}

function updateApproval(id, decision) {
  const item = state.approvals.find((approvalItem) => approvalItem.id === id);
  if (!item) return;
  item.status = decision;
  item.comments = item.comments || [];
  item.comments.push({ by: state.ui.currentUser || "Current User", at: toISO(new Date()), text: decision });
  if (decision === "Revision Requested") {
    state.tasks
      .filter((taskItem) => taskItem.projectId === item.projectId)
      .slice(0, 1)
      .forEach((taskItem) => {
        taskItem.status = "Revision Required";
        taskItem.revisionCount += 1;
      });
  }
  recordActivity(item.projectId, "approval", `${item.deliverable}: ${decision}`, "approval", item.id);
  appendAudit("Approval action", `${item.deliverable}: ${decision}`);
  saveState();
  render();
}

function bumpAssetVersion(id) {
  const item = state.assets.find((assetItem) => assetItem.id === id);
  if (!item) return;
  item.version += 1;
  item.status = "Pending";
  item.versionHistory = item.versionHistory || [];
  const versionRecord = {
    id: makeId("av"),
    assetId: item.id,
    version: item.version,
    storagePath: item.storagePath,
    createdBy: state.ui.currentUser || "Current User",
    note: `Version ${item.version} registered`,
    fileSize: Number(item.fileSize || 0),
    createdAt: toISO(new Date())
  };
  item.versionHistory.unshift(versionRecord);
  state.assetVersions = state.assetVersions || [];
  state.assetVersions.unshift(versionRecord);
  recordActivity(item.projectId, "asset_version", `${item.name} moved to v${item.version}`, "asset", item.id);
  appendAudit("Version history", `${item.name} moved to v${item.version}`);
  saveState();
  render();
}

function downloadAsset(id) {
  const item = state.assets.find((assetItem) => assetItem.id === id);
  if (!item) return;
  item.downloads = Number(item.downloads || 0) + 1;
  item.usageHistory = item.usageHistory || [];
  item.usageHistory.push({ at: toISO(new Date()), by: state.ui.currentUser || "Current User" });
  if (item.storagePath && navigator.clipboard) {
    navigator.clipboard.writeText(item.storagePath).catch(() => {});
  }
  appendAudit("NAS path copied", item.name);
  saveState();
  render();
}

function returnEquipment(id) {
  const item = state.equipment.find((equipmentItem) => equipmentItem.id === id);
  if (!item) return;
  item.availability = "Available";
  item.currentUser = "";
  item.returnDate = "";
  appendAudit("Equipment returned", item.name);
  saveState();
  render();
}

function moveCalendar(step, reset = false) {
  state.ui.calendarOffset = reset ? 0 : Number(state.ui.calendarOffset || 0) + step;
  saveState();
  render();
}

function resetData() {
  const ok = window.confirm("Reset local demo data?");
  if (!ok) return;
  state = clone(seed);
  saveState();
  render();
}

function exportReport(format) {
  const rows = [
    ["Metric", "Value"],
    ["Active Projects", metrics().activeProjects],
    ["Completed Projects", metrics().completedProjects],
    ["Projects At Risk", metrics().projectsAtRisk],
    ["Overdue Projects", metrics().overdueProjects],
    ["Pending Approvals", metrics().pendingApprovals],
    ["Revision Requests", metrics().revisionRequests],
    ["Server Links", metrics().serverLinks],
    ["Proxy Queue", metrics().proxyQueue]
  ];
  if (format === "pdf") {
    window.print();
    return;
  }
  if (format === "excel") {
    const html = `<table>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join("")}</table>`;
    downloadFile("creative-monitor-report.xls", "application/vnd.ms-excel", html);
    return;
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile("creative-monitor-report.csv", "text/csv", csv);
}

function downloadFile(name, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function filteredProjects() {
  const term = String(state.ui.projectSearch || "").trim().toLowerCase();
  return safeList(state.projects).filter((project) => {
    const matchesTerm = !term || [
      project.name,
      project.code,
      project.client,
      project.department,
      project.campaign,
      project.type,
      project.priority,
      project.status,
      project.workflowStage,
      ...safeList(project.tags)
    ].join(" ").toLowerCase().includes(term);
    const matchesStatus = state.ui.projectStatus === "All" || project.status === state.ui.projectStatus;
    const matchesDepartment = state.ui.projectDepartment === "All" || project.department === state.ui.projectDepartment;
    return matchesTerm && matchesStatus && matchesDepartment;
  });
}

function filteredTasks() {
  const term = String(state.ui.taskSearch || "").trim().toLowerCase();
  return safeList(state.tasks).filter((taskItem) => {
    const project = projectById(taskItem.projectId);
    const matchesTerm = !term || [
      taskItem.name,
      taskItem.description,
      taskItem.assignee,
      taskItem.reviewer,
      taskItem.stage,
      project?.name,
      project?.code
    ].join(" ").toLowerCase().includes(term);
    const matchesStatus = state.ui.taskStatus === "All" || taskItem.status === state.ui.taskStatus;
    return matchesTerm && matchesStatus;
  });
}

function getSelectedProject(projects) {
  const current = safeList(state.projects).find((project) => project.id === state.ui.selectedProjectId);
  if (current && projects.some((project) => project.id === current.id)) return current;
  return projects[0] || null;
}

function metrics() {
  const today = toISO(new Date());
  const inSeven = datePlus(7);
  const activeProjects = state.projects.filter((project) => !["Completed", "Cancelled"].includes(project.status)).length;
  const completedProjects = state.projects.filter((project) => project.status === "Completed").length;
  const projectsAtRisk = state.projects.filter((project) => project.status === "At Risk").length;
  const overdueProjects = state.projects.filter((project) => project.deadline < today && project.status !== "Completed").length;
  const upcomingDeadlines = state.projects.filter((project) => project.deadline >= today && project.deadline <= inSeven && project.status !== "Completed").length;
  const pendingApprovals = state.approvals.filter((item) => item.status === "Pending").length;
  const revisionRequests = state.tasks.filter((item) => item.status === "Revision Required").length + state.approvals.filter((item) => item.status === "Revision Requested").length;
  const publishedContent = state.assets.filter((item) => item.category === "Final Deliverable" || item.status === "Approved").length;
  const clientWaiting = state.approvals.filter((item) => item.level === "Client" && item.status === "Pending").length;
  const serverLinks = state.assets.filter((item) => item.storagePath).length;
  const proxyQueue = state.assets.filter((item) => ["proxy_needed", "proxy_processing"].includes(item.processingStatus)).length;
  const avgWorkload = Math.round(state.team.reduce((sum, item) => sum + item.utilization, 0) / Math.max(state.team.length, 1));
  const inProduction = state.projects.filter((project) => {
    const index = workflowStages.indexOf(project.workflowStage);
    return index >= 6 && index <= 12;
  }).length;
  return {
    activeProjects,
    completedProjects,
    projectsAtRisk,
    overdueProjects,
    upcomingDeadlines,
    pendingApprovals,
    revisionRequests,
    publishedContent,
    clientWaiting,
    serverLinks,
    proxyQueue,
    avgWorkload,
    inProduction
  };
}

function workflowChart() {
  const counts = workflowStages
    .map((stage) => ({ stage, count: state.projects.filter((project) => project.workflowStage === stage).length }))
    .filter((item) => item.count > 0);
  const max = Math.max(...counts.map((item) => item.count), 1);
  return counts.map((item) => reportBar({ label: item.stage, value: Math.round((item.count / max) * 100), count: item.count })).join("");
}

function deadlineList() {
  const projectDeadlines = state.projects
    .filter((project) => project.status !== "Completed")
    .map((project) => ({ title: project.name, meta: `${project.code} | Project deadline`, date: project.deadline, tone: project.deadline < toISO(new Date()) ? "red" : "yellow" }));
  const taskDeadlines = state.tasks
    .filter((taskItem) => !["Completed", "Cancelled"].includes(taskItem.status))
    .map((taskItem) => ({ title: taskItem.name, meta: `${projectById(taskItem.projectId)?.code || "Task"} | ${taskItem.assignee}`, date: taskItem.dueDate, tone: taskItem.status === "Blocked" ? "red" : "blue" }));
  return [...projectDeadlines, ...taskDeadlines].sort((a, b) => a.date.localeCompare(b.date));
}

function deadlineItem(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-meta">${escapeHtml(item.meta)}</div>
        </div>
        <span class="status-dot ${item.tone}"></span>
      </div>
      <span class="small muted">${dateStatus(item.date)}</span>
    </article>
  `;
}

function personWorkloadBar(personItem) {
  return reportBar({ label: personItem.name, value: personItem.utilization, count: `${assignedTaskHours(personItem.name)}h` });
}

function departmentPerformance() {
  const counts = departments.map((department) => ({
    label: department,
    count: state.projects.filter((project) => project.department === department).length
  })).filter((item) => item.count > 0);
  const max = Math.max(...counts.map((item) => item.count), 1);
  return counts.map((item) => ({ label: item.label, value: Math.round((item.count / max) * 100), count: item.count }));
}

function platformDistribution() {
  const counts = {};
  state.projects.forEach((project) => {
    project.platform.split(",").map((item) => item.trim()).filter(Boolean).forEach((platform) => {
      counts[platform] = (counts[platform] || 0) + 1;
    });
  });
  const entries = Object.entries(counts).map(([label, count]) => ({ label, count }));
  const max = Math.max(...entries.map((item) => item.count), 1);
  return entries.map((item) => ({ label: item.label, value: Math.round((item.count / max) * 100), count: item.count }));
}

function revisionReport() {
  const rows = state.projects.map((project) => {
    const projectTasks = state.tasks.filter((taskItem) => taskItem.projectId === project.id);
    const count = projectTasks.reduce((sum, taskItem) => sum + taskItem.revisionCount, 0);
    return { label: project.code, count };
  });
  const max = Math.max(...rows.map((item) => item.count), 1);
  return rows.map((item) => ({ label: item.label, value: Math.round((item.count / max) * 100), count: item.count }));
}

function reportBar(item) {
  return `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(item.label)}</div>
      <div class="bar-track"><span style="--value:${clamp(Number(item.value), 0, 100)}%"></span></div>
      <div class="small muted">${escapeHtml(String(item.count))}</div>
    </div>
  `;
}

function calendarEvents() {
  const projectEvents = state.projects.map((project) => ({ date: project.deadline, title: project.code, meta: project.name, tone: project.status === "Completed" ? "green" : "red" }));
  const taskEvents = state.tasks.map((taskItem) => ({ date: taskItem.dueDate, title: taskItem.name, meta: taskItem.assignee, tone: taskItem.status === "Completed" ? "green" : "" }));
  const approvalEvents = state.approvals.map((item) => ({ date: item.dueDate, title: item.level, meta: item.deliverable, tone: item.status === "Approved" ? "green" : "red" }));
  const bookingEvents = state.equipment.filter((item) => item.returnDate).map((item) => ({ date: item.returnDate, title: item.name, meta: item.currentUser || "Equipment", tone: "" }));
  return [...projectEvents, ...taskEvents, ...approvalEvents, ...bookingEvents];
}

function calendarAgendaItem(event) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(event.title)}</div>
          <div class="item-meta">${escapeHtml(event.meta)}</div>
        </div>
        <span class="status-dot ${event.tone}"></span>
      </div>
      <span class="small muted">${formatDate(event.date)}</span>
    </article>
  `;
}

function auditItem(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.action)}</div>
          <div class="item-meta">${escapeHtml(item.actor)} | ${formatDate(item.date)}</div>
        </div>
      </div>
      <p class="muted small">${escapeHtml(item.detail)}</p>
    </article>
  `;
}

function announcementItem(item) {
  return `
    <article class="list-item">
      <div class="item-head">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-meta">${escapeHtml(item.owner)} | ${formatDate(item.date)}</div>
        </div>
      </div>
      <p class="muted small">${escapeHtml(item.body)}</p>
    </article>
  `;
}

function workflowStage(current, stage) {
  const currentIndex = workflowStages.indexOf(current);
  const stageIndex = workflowStages.indexOf(stage);
  const stateClass = stageIndex < currentIndex ? "done" : stageIndex === currentIndex ? "current" : "";
  return `<div class="stage ${stateClass}">${escapeHtml(stage)}</div>`;
}

function renderBrief(briefData) {
  const keys = [
    ["Client Background", "clientBackground"],
    ["Business Objectives", "businessObjectives"],
    ["Campaign Objectives", "campaignObjectives"],
    ["Brand Guidelines", "brandGuidelines"],
    ["Target Audience", "targetAudience"],
    ["Tone of Voice", "toneOfVoice"],
    ["Competitor References", "competitorReferences"],
    ["Color Palette", "colorPalette"],
    ["Typography", "typography"],
    ["Visual References", "visualReferences"],
    ["Key Messages", "keyMessages"],
    ["Call To Action", "callToAction"],
    ["Platform Requirements", "platformRequirements"],
    ["Aspect Ratio", "aspectRatio"],
    ["Resolution", "resolution"],
    ["File Format", "fileFormat"],
    ["Duration", "duration"],
    ["Approval Requirements", "approvalRequirements"]
  ];
  return keys.map(([label, key]) => detail(label, briefData[key] || "TBD")).join("");
}

function miniList(title, items) {
  return `
    <div class="card">
      <h3>${escapeHtml(title)}</h3>
      <div class="list" style="margin-top:10px">
        ${safeList(items).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("") || `<span class="muted small">None</span>`}
      </div>
    </div>
  `;
}

function summaryCard(title, value, note) {
  return `
    <div class="card kpi">
      <div class="kpi-label">${escapeHtml(title)}</div>
      <div>
        <div class="kpi-value">${escapeHtml(String(value))}</div>
        <div class="kpi-note">${escapeHtml(note)}</div>
      </div>
    </div>
  `;
}

function detail(label, value) {
  return `
    <div class="detail-field">
      <span>${escapeHtml(label)}</span>
      <div>${escapeHtml(String(value || "TBD"))}</div>
    </div>
  `;
}

function disclosure(title, body, open = false) {
  return `
    <details class="disclosure" ${open ? "open" : ""}>
      <summary>${escapeHtml(title)}</summary>
      <div class="disclosure-body">${body}</div>
    </details>
  `;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "Size TBD";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index >= 3 ? 2 : 1)} ${units[index]}`;
}

function statusLabel(value) {
  return String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeNasPath(value) {
  return String(value || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
}

function pill(value) {
  const key = String(value).toLowerCase().replace(/\s+/g, "-");
  const tone = {
    high: "high",
    medium: "medium",
    low: "low",
    "at-risk": "at-risk",
    overdue: "overdue",
    blocked: "blocked",
    "revision-required": "revision",
    "revision-requested": "revision",
    "waiting-approval": "waiting",
    "waiting-review": "waiting",
    pending: "pending",
    planning: "pending",
    "in-progress": "progress",
    completed: "completed",
    approved: "approved",
    available: "available",
    booked: "in-use",
    "in-use": "in-use",
    unavailable: "blocked",
    rejected: "blocked",
    cancelled: "cancelled",
    green: "available",
    amber: "waiting",
    red: "blocked",
    critical: "overdue",
    minor: "available",
    moderate: "waiting",
    major: "blocked",
    pass: "approved",
    escalated: "overdue"
  }[key] || "pending";
  return `<span class="pill ${tone}">${escapeHtml(String(value))}</span>`;
}

function options(items, selected) {
  return items.map((item) => {
    const value = Array.isArray(item) ? item[0] : item;
    const label = Array.isArray(item) ? item[1] : item;
    return `<option value="${escapeAttr(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function multiOptions(items, selectedItems = []) {
  const selected = new Set(safeList(selectedItems).map(String));
  return items.map((item) => {
    const value = Array.isArray(item) ? item[0] : item;
    const label = Array.isArray(item) ? item[1] : item;
    return `<option value="${escapeAttr(value)}" ${selected.has(String(value)) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
}

function userChoices() {
  return safeList(state.team)
    .filter((personItem) => !["Client"].includes(personItem.role))
    .map((personItem) => [personItem.name, `${personItem.name} - ${personItem.role || "Staff"}`]);
}

function formField(label, name, value = "", type = "text", required = false) {
  const id = `${name}-${Math.random().toString(16).slice(2)}`;
  return `
    <div class="form-field">
      <label for="${id}">${escapeHtml(label)}</label>
      <input id="${id}" name="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" ${required ? "required" : ""}>
    </div>
  `;
}

function textField(label, name, value = "") {
  const id = `${name}-${Math.random().toString(16).slice(2)}`;
  return `
    <div class="form-field wide">
      <label for="${id}">${escapeHtml(label)}</label>
      <textarea id="${id}" name="${escapeAttr(name)}">${escapeHtml(value)}</textarea>
    </div>
  `;
}

function selectField(label, name, choices, selected) {
  const id = `${name}-${Math.random().toString(16).slice(2)}`;
  return `
    <div class="form-field">
      <label for="${id}">${escapeHtml(label)}</label>
      <select id="${id}" name="${escapeAttr(name)}">${options(choices, selected)}</select>
    </div>
  `;
}

function multiSelectField(label, name, choices, selected = []) {
  const id = `${name}-${Math.random().toString(16).slice(2)}`;
  const selectedSet = new Set(safeList(selected).map(String));
  const selectedLabels = choices
    .filter((item) => selectedSet.has(String(Array.isArray(item) ? item[0] : item)))
    .map((item) => Array.isArray(item) ? item[1] : item);
  const summary = selectedLabels.length ? `${selectedLabels.length} selected` : "Select staff";
  return `
    <div class="form-field checkbox-select-field">
      <label id="${id}-label">${escapeHtml(label)}</label>
      <details class="checkbox-select">
        <summary aria-labelledby="${id}-label">${escapeHtml(summary)}</summary>
        <div class="checkbox-select-menu">
          ${choices.map((item, index) => {
            const value = Array.isArray(item) ? item[0] : item;
            const optionLabel = Array.isArray(item) ? item[1] : item;
            const optionId = `${id}-${index}`;
            return `
              <label class="checkbox-option" for="${optionId}">
                <input id="${optionId}" type="checkbox" name="${escapeAttr(name)}" value="${escapeAttr(value)}" ${selectedSet.has(String(value)) ? "checked" : ""}>
                <span>${escapeHtml(optionLabel)}</span>
              </label>
            `;
          }).join("")}
        </div>
      </details>
    </div>
  `;
}

function modalFooter() {
  return `
    <div class="modal-footer">
      <button type="button" class="button" data-action="close-modal">Cancel</button>
      <button type="submit" class="button primary">Save</button>
    </div>
  `;
}

function projectWizardFooter() {
  return `
    <div class="modal-footer wizard-footer">
      <button type="button" class="button" data-action="wizard-back" disabled>Back</button>
      <div class="wizard-actions">
        <button type="button" class="button" data-action="close-modal">Cancel</button>
        <button type="button" class="button primary" data-action="wizard-next">Next</button>
        <button type="submit" class="button primary" data-wizard-submit hidden>Create Project</button>
      </div>
    </div>
  `;
}

function empty(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function projectById(id) {
  return safeList(state.projects).find((project) => project.id === id);
}

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function projectProgress(project) {
  const index = workflowStages.indexOf(project.workflowStage);
  if (index < 0) return 0;
  return Math.round((index / (workflowStages.length - 1)) * 100);
}

function taskCompletion(taskItem) {
  if (taskItem.status === "Completed") return 100;
  const ratio = Number(taskItem.actualHours || 0) / Math.max(Number(taskItem.estimatedHours || 1), 1);
  return clamp(Math.round(ratio * 100), 0, 98);
}

function taskProgressPercent(taskItem) {
  if (taskItem.status === "Completed") return 100;
  if (Number.isFinite(Number(taskItem.progressPercent)) && Number(taskItem.progressPercent) > 0) {
    return clamp(Math.round(Number(taskItem.progressPercent)), 0, 100);
  }
  return taskCompletion(taskItem);
}

function notificationsFor(user) {
  return (state.notifications || [])
    .filter((item) => !item.user || item.user === user || item.user === "Admin")
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function memberProjects(user) {
  const taskProjectIds = new Set(
    state.tasks
      .filter((taskItem) => taskItem.assignee === user || taskItem.reviewer === user)
      .map((taskItem) => taskItem.projectId)
  );

  return state.projects.filter((project) => {
    const team = Array.isArray(project.assignedTeamMembers) ? project.assignedTeamMembers : [];
    const access = Array.isArray(project.accessMembers) ? project.accessMembers : [];
    return team.includes(user) || access.includes(user) || project.assignedManager === user || taskProjectIds.has(project.id);
  });
}

function userVideos(user) {
  return (state.videos || [])
    .filter((video) => [video.scriptwriter, video.checker, video.verifier, video.editor, video.qc, video.approver, video.publisher].includes(user))
    .sort((a, b) => String(a.deadline || "").localeCompare(String(b.deadline || "")));
}

function userOpenRemarks(user) {
  return (state.qcRemarks || [])
    .filter((remark) => (remark.assignedTo === user || remark.createdBy === user) && !["Resolved", "Closed"].includes(remark.status))
    .sort((a, b) => {
      const severity = { Critical: 0, Major: 1, Moderate: 2, Minor: 3 };
      return (severity[a.severity] ?? 9) - (severity[b.severity] ?? 9);
    });
}

function accessList(project) {
  const explicit = Array.isArray(project.accessMembers) ? project.accessMembers : [];
  const team = Array.isArray(project.assignedTeamMembers) ? project.assignedTeamMembers : [];
  return Array.from(new Set([...explicit, ...team, project.assignedManager].filter(Boolean)));
}

function commentsForProject(projectId) {
  return (state.comments || [])
    .filter((comment) => comment.projectId === projectId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function activityForProject(projectId) {
  return (state.activity || [])
    .filter((item) => item.projectId === projectId)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function assetVersionsFor(assetId) {
  const fromAsset = state.assets.find((assetItem) => assetItem.id === assetId)?.versionHistory || [];
  const fromState = (state.assetVersions || []).filter((version) => version.assetId === assetId);
  const all = [...fromAsset, ...fromState];
  const byKey = new Map(all.map((version) => [`${version.assetId}-${version.version}-${version.storagePath}`, version]));
  return Array.from(byKey.values()).sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
}

function remarksForVideo(videoId) {
  return (state.qcRemarks || []).filter((remark) => remark.videoId === videoId);
}

function weightedVideoProgress(video) {
  const base = Number(video.progress || 0);
  const stageWeight = (state.workflowWeightage || []).find((item) => String(video.currentStage || "").toLowerCase().includes(String(item.stage || "").split(" ")[0].toLowerCase()));
  if (!stageWeight) return clamp(base, 0, 100);
  return clamp(Math.round((base * Number(stageWeight.weight || 0)) / 100 + completedStageWeight(video.currentStage)), 0, 100);
}

function completedStageWeight(currentStage) {
  const stage = String(currentStage || "");
  let total = 0;
  for (const item of state.workflowWeightage || []) {
    if (stage.toLowerCase().includes(String(item.stage || "").split(" ")[0].toLowerCase())) break;
    total += Number(item.weight || 0);
  }
  return total;
}

function average(values) {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numbers.length) return 0;
  return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
}

function qcDecisionCount(decision) {
  const normalized = decision.toLowerCase();
  return (state.qcRemarks || []).filter((remark) => String(remark.decision || remark.status || "").toLowerCase().includes(normalized.split(" ")[0])).length;
}

function extractMentions(text) {
  return Array.from(String(text || "").matchAll(/@([A-Za-z][A-Za-z .'-]{1,40})/g))
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function normalizeTimecode(value) {
  const text = String(value || "").trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
    return text;
  }

  const seconds = Number(text);
  if (Number.isFinite(seconds) && seconds >= 0) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return "00:00";
}

function proxyPathFor(projectId, filename) {
  const project = projectById(projectId);
  const base = project?.nasFolder || `projects/${project?.code || projectId}`;
  const stem = String(filename || "asset").replace(/\.[^.]+$/, "");
  return normalizeNasPath(`${base}/proxies/${stem}_proxy.mp4`);
}

function assignedTaskHours(name) {
  return state.tasks
    .filter((taskItem) => taskItem.assignee === name && !["Completed", "Cancelled"].includes(taskItem.status))
    .reduce((sum, taskItem) => sum + Number(taskItem.estimatedHours || 0), 0);
}

function projectHours(projectId) {
  return state.tasks
    .filter((taskItem) => taskItem.projectId === projectId)
    .reduce((sum, taskItem) => sum + Number(taskItem.actualHours || 0), 0);
}

function syncProjectHours(projectId) {
  const project = projectById(projectId);
  if (project) project.actualHours = projectHours(projectId);
}

function dateStatus(date) {
  const today = toISO(new Date());
  const className = date < today ? "overdue" : "pending";
  return `<span class="pill ${className}">${formatDate(date)}</span>`;
}

function formatDate(date) {
  if (!date) return "TBD";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatLongDate(date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function money(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function datePlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISO(date);
}

function dateFrom(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + Number(days || 0));
  return toISO(date);
}

function toISO(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function brief(overrides) {
  return {
    clientBackground: "TBD",
    businessObjectives: "TBD",
    campaignObjectives: "TBD",
    brandGuidelines: "Use approved logos, typography, and color standards.",
    targetAudience: "TBD",
    toneOfVoice: "Clear, brand-safe, audience specific",
    competitorReferences: "TBD",
    colorPalette: "Brand palette",
    typography: "Brand fonts",
    visualReferences: "Moodboard and prior campaign assets",
    keyMessages: "TBD",
    callToAction: "TBD",
    platformRequirements: "Channel-specific exports",
    aspectRatio: "TBD",
    resolution: "HD and platform-native",
    fileFormat: "TBD",
    duration: "TBD",
    deadline: "TBD",
    budget: "TBD",
    approvalRequirements: "Creative Lead, Marketing Manager, Client",
    additionalNotes: "TBD",
    ...overrides
  };
}

function task(id, projectId, name, stage, priority, assignee, reviewer, startDate, dueDate, estimatedHours, actualHours, status, revisionCount) {
  const progressPercent = status === "Completed" ? 100 : clamp(Math.round((actualHours / Math.max(estimatedHours, 1)) * 100), 0, 98);
  return {
    id,
    projectId,
    name,
    description: `${name} for ${stage}.`,
    priority,
    assignee,
    reviewer,
    dueDate,
    startDate,
    completionDate: status === "Completed" ? dueDate : "",
    estimatedHours,
    actualHours,
    checklist: [
      { text: "Source files checked", done: status === "Completed" },
      { text: "Reviewer notes captured", done: ["Waiting Approval", "Completed"].includes(status) }
    ],
    attachments: [],
    comments: [],
    dependencies: [],
    revisionCount,
    status,
    stage,
    progressPercent,
    lastProgressNote: "",
    lastProgressAt: ""
  };
}

function approval(id, projectId, deliverable, level, approver, status, dueDate, notes) {
  return {
    id,
    projectId,
    deliverable,
    level,
    approver,
    status,
    dueDate,
    notes,
    comments: status === "Approved" ? [{ by: approver, at: dueDate, text: "Approved" }] : []
  };
}

function equipment(id, name, type, serialNumber, condition, availability, currentUser, returnDate, maintenanceDate, purchaseDate, replacementDate) {
  return {
    id,
    name,
    type,
    serialNumber,
    condition,
    availability,
    currentUser,
    returnDate,
    maintenanceDate,
    warrantyDate: replacementDate,
    purchaseDate,
    replacementDate,
    bookingHistory: currentUser ? [{ user: currentUser, bookedAt: datePlus(-2), returnDate }] : []
  };
}

function asset(id, name, format, projectId, category, version, tags, status, downloads) {
  return {
    id,
    name,
    format,
    projectId,
    category,
    storageDisk: "nas",
    storagePath: `raw/${projectId}/${name}`,
    originalFilename: name,
    fileSize: 0,
    mimeType: "",
    uploadStatus: "on_nas",
    processingStatus: "not_started",
    version,
    tags,
    status,
    downloads,
    usageHistory: [],
    createdAt: datePlus(-3)
  };
}

function person(id, name, title, department, role, utilization, skills) {
  return { id, name, title, department, role, utilization, skills };
}

function logEntry(actor, detail, date) {
  return { id: makeId("log"), actor, action: detail.split(" ").slice(0, 3).join(" "), detail, date };
}

function appendAudit(action, detail) {
  state.audit.unshift({
    id: makeId("log"),
    actor: "Current User",
    action,
    detail,
    date: toISO(new Date())
  });
}

function duplicateCount() {
  const counts = {};
  state.assets.forEach((item) => {
    const key = item.name.toLowerCase().replace(/_v\d+/g, "");
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.values(counts).filter((count) => count > 1).length;
}

function nextProjectCode() {
  const numbers = state.projects
    .map((project) => Number((project.code.match(/(\d+)$/) || [0, 0])[1]))
    .filter(Boolean);
  return `CR-2026-${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listFromField(value) {
  return Array.isArray(value) ? value.filter(Boolean) : splitList(value);
}

function uniqueList(items) {
  return Array.from(new Set(safeList(items).filter(Boolean)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}
