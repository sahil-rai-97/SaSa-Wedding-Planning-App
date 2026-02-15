export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskOwner = "Sahil" | "Saloni" | "Unassigned";

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  owner: TaskOwner;
  fileIds: string[];
  contextLog: string[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  iconLink: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "appointment" | "milestone";
  taskId?: string;
}

// Wedding date constant
export const WEDDING_DATE = new Date("2026-04-26T00:00:00");
export const WEDDING_VENUE = "Old Mill Park Amphitheatre";

export const mockTasks: Task[] = [
  {
    id: "task-001",
    title: "Book photographer",
    description:
      "Research and finalize a wedding photographer. Get quotes from at least 3 vendors.",
    dueDate: "2026-01-15",
    status: "done",
    owner: "Saloni",
    fileIds: ["drive-001"],
    contextLog: [
      "Saloni found 3 options: Studio A, Studio B, Studio C",
      "Studio B confirmed availability for April 26",
    ],
  },
  {
    id: "task-002",
    title: "Finalize guest list",
    description:
      "Compile the final guest list with addresses for invitations. Confirm RSVPs from both families.",
    dueDate: "2026-02-01",
    status: "in-progress",
    owner: "Sahil",
    fileIds: ["drive-002"],
    contextLog: [
      "Initial list has 180 guests",
      "Need to confirm Sahil's extended family",
    ],
  },
  {
    id: "task-003",
    title: "Order wedding invitations",
    description:
      "Design and order custom wedding invitations. Include RSVP cards and envelope liners.",
    dueDate: "2026-02-15",
    status: "todo",
    owner: "Saloni",
    fileIds: [],
    contextLog: ["Looked at Minted and Paperless Post"],
  },
  {
    id: "task-004",
    title: "Book DJ / Band",
    description:
      "Find and book entertainment for the reception. Create a playlist of must-play songs.",
    dueDate: "2026-02-20",
    status: "todo",
    owner: "Sahil",
    fileIds: [],
    contextLog: [],
  },
  {
    id: "task-005",
    title: "Venue walkthrough",
    description:
      "Schedule a walkthrough at Old Mill Park Amphitheatre. Discuss layout, seating, and AV setup.",
    dueDate: "2026-03-01",
    status: "todo",
    owner: "Unassigned",
    fileIds: ["drive-003"],
    contextLog: [
      "Venue contact: events@oldmillpark.com",
      "Available Saturdays for walkthrough",
    ],
  },
  {
    id: "task-006",
    title: "Catering menu tasting",
    description:
      "Attend the menu tasting session with the caterer. Select entrees, appetizers, and desserts.",
    dueDate: "2026-03-10",
    status: "todo",
    owner: "Saloni",
    fileIds: ["drive-004"],
    contextLog: ["Caterer: Delicious Bites Co."],
  },
  {
    id: "task-007",
    title: "Arrange transportation",
    description:
      "Book transportation for the wedding party and guests. Consider shuttle service from hotel.",
    dueDate: "2026-03-20",
    status: "todo",
    owner: "Sahil",
    fileIds: [],
    contextLog: [],
  },
  {
    id: "task-008",
    title: "Floral arrangements",
    description:
      "Finalize floral arrangements with the florist. Choose centerpieces, bouquets, and boutonnieres.",
    dueDate: "2026-03-15",
    status: "in-progress",
    owner: "Saloni",
    fileIds: ["drive-005"],
    contextLog: [
      "Florist: Bloom & Petal",
      "Saloni prefers peonies and roses in blush tones",
    ],
  },
  {
    id: "task-009",
    title: "Rehearsal dinner planning",
    description:
      "Plan the rehearsal dinner. Book a restaurant and create the guest list.",
    dueDate: "2026-04-10",
    status: "todo",
    owner: "Unassigned",
    fileIds: [],
    contextLog: ["Considering Italian restaurant downtown"],
  },
  {
    id: "task-010",
    title: "Wedding day timeline",
    description:
      "Create a detailed minute-by-minute timeline for the wedding day. Share with all vendors.",
    dueDate: "2026-04-15",
    status: "todo",
    owner: "Unassigned",
    fileIds: [],
    contextLog: [],
  },
];

export const mockDriveFiles: DriveFile[] = [
  {
    id: "drive-001",
    name: "Photographer_Quotes.pdf",
    mimeType: "application/pdf",
    modifiedTime: "2025-12-20T14:30:00Z",
    size: "2.4 MB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-002",
    name: "Guest_List_v3.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    modifiedTime: "2026-01-10T09:15:00Z",
    size: "156 KB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-003",
    name: "Venue_Floor_Plan.pdf",
    mimeType: "application/pdf",
    modifiedTime: "2025-11-05T16:45:00Z",
    size: "5.1 MB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-004",
    name: "Catering_Menu_Options.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    modifiedTime: "2026-01-08T11:20:00Z",
    size: "890 KB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-005",
    name: "Floral_Inspiration_Board.jpg",
    mimeType: "image/jpeg",
    modifiedTime: "2026-01-12T08:00:00Z",
    size: "3.7 MB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-006",
    name: "Budget_Tracker.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    modifiedTime: "2026-01-14T17:30:00Z",
    size: "210 KB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-007",
    name: "Invitation_Design_Draft.png",
    mimeType: "image/png",
    modifiedTime: "2026-01-05T13:10:00Z",
    size: "1.2 MB",
    iconLink: "",
    webViewLink: "#",
  },
  {
    id: "drive-008",
    name: "Seating_Chart_Draft.pdf",
    mimeType: "application/pdf",
    modifiedTime: "2026-01-09T10:45:00Z",
    size: "420 KB",
    iconLink: "",
    webViewLink: "#",
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "evt-001",
    title: "Book photographer (deadline)",
    date: "2026-01-15",
    type: "deadline",
    taskId: "task-001",
  },
  {
    id: "evt-002",
    title: "Finalize guest list",
    date: "2026-02-01",
    type: "deadline",
    taskId: "task-002",
  },
  {
    id: "evt-003",
    title: "Order invitations",
    date: "2026-02-15",
    type: "deadline",
    taskId: "task-003",
  },
  {
    id: "evt-004",
    title: "Book DJ / Band",
    date: "2026-02-20",
    type: "deadline",
    taskId: "task-004",
  },
  {
    id: "evt-005",
    title: "Venue walkthrough",
    date: "2026-03-01",
    type: "appointment",
    taskId: "task-005",
  },
  {
    id: "evt-006",
    title: "Catering tasting",
    date: "2026-03-10",
    type: "appointment",
    taskId: "task-006",
  },
  {
    id: "evt-007",
    title: "Floral arrangements due",
    date: "2026-03-15",
    type: "deadline",
    taskId: "task-008",
  },
  {
    id: "evt-008",
    title: "Arrange transportation",
    date: "2026-03-20",
    type: "deadline",
    taskId: "task-007",
  },
  {
    id: "evt-009",
    title: "Rehearsal dinner",
    date: "2026-04-10",
    type: "appointment",
    taskId: "task-009",
  },
  {
    id: "evt-010",
    title: "Wedding day timeline due",
    date: "2026-04-15",
    type: "deadline",
    taskId: "task-010",
  },
  {
    id: "evt-011",
    title: "Wedding Day!",
    date: "2026-04-26",
    type: "milestone",
  },
];

export const mockChatMessages: { role: "user" | "assistant"; content: string }[] = [
  {
    role: "user",
    content: "What's our wedding date?",
  },
  {
    role: "assistant",
    content:
      "Your wedding is on **April 26, 2026** at **Old Mill Park Amphitheatre**. That's coming up! Based on your task list, you still have a few key items to finalize.",
  },
];
