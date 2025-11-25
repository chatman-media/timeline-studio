import React from "react"

import { vi } from "vitest"

const createMockIcon = (name: string) => {
  const MockIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(function MockLucideIcon(props, ref) {
    return React.createElement(
      "svg",
      {
        ...props,
        ref,
        "data-testid": `${name.toLowerCase()}-icon`,
        "data-icon": name,
      },
      name,
    )
  })
  MockIcon.displayName = `Mock${name}Icon`
  return MockIcon
}

// Export all commonly used icons
export const Activity = createMockIcon("Activity")
export const AlertCircle = createMockIcon("AlertCircle")
export const AlertTriangle = createMockIcon("AlertTriangle")
export const AlignCenter = createMockIcon("AlignCenter")
export const ArrowLeftRight = createMockIcon("ArrowLeftRight")
export const ArrowRight = createMockIcon("ArrowRight")
export const AudioLines = createMockIcon("AudioLines")
export const Blend = createMockIcon("Blend")
export const Bookmark = createMockIcon("Bookmark")
export const Bot = createMockIcon("Bot")
export const Brain = createMockIcon("Brain")
export const BarChart3 = createMockIcon("BarChart3")
export const Camera = createMockIcon("Camera")
export const Check = createMockIcon("Check")
export const CheckCircle = createMockIcon("CheckCircle")
export const CheckCircle2 = createMockIcon("CheckCircle2")
export const CheckIcon = createMockIcon("CheckIcon")
export const CheckSquare = createMockIcon("CheckSquare")
export const ChevronDown = createMockIcon("ChevronDown")
export const ChevronDownIcon = createMockIcon("ChevronDownIcon")
export const ChevronFirst = createMockIcon("ChevronFirst")
export const ChevronLast = createMockIcon("ChevronLast")
export const ChevronLeft = createMockIcon("ChevronLeft")
export const ChevronRight = createMockIcon("ChevronRight")
export const ChevronRightIcon = createMockIcon("ChevronRightIcon")
export const ChevronUpIcon = createMockIcon("ChevronUpIcon")
export const CircleDot = createMockIcon("CircleDot")
export const CircleIcon = createMockIcon("CircleIcon")
export const CirclePause = createMockIcon("CirclePause")
export const CirclePlay = createMockIcon("CirclePlay")
export const Clapperboard = createMockIcon("Clapperboard")
export const Clock = createMockIcon("Clock")
export const Copy = createMockIcon("Copy")
export const CopyPlus = createMockIcon("CopyPlus")
export const Cpu = createMockIcon("Cpu")
export const Database = createMockIcon("Database")
export const Download = createMockIcon("Download")
export const Eye = createMockIcon("Eye")
export const EyeOff = createMockIcon("EyeOff")
export const File = createMockIcon("File")
export const FileAudio = createMockIcon("FileAudio")
export const FileImage = createMockIcon("FileImage")
export const FileText = createMockIcon("FileText")
export const FilePlus = createMockIcon("FilePlus")
export const FileVideo = createMockIcon("FileVideo")
export const Film = createMockIcon("Film")
export const Filter = createMockIcon("Filter")
export const FlipHorizontal2 = createMockIcon("FlipHorizontal2")
export const Folder = createMockIcon("Folder")
export const FolderClosed = createMockIcon("FolderClosed")
export const FolderOpen = createMockIcon("FolderOpen")
export const Gauge = createMockIcon("Gauge")
export const GitBranch = createMockIcon("GitBranch")
export const GitCommit = createMockIcon("GitCommit")
export const Globe = createMockIcon("Globe")
export const Grid = createMockIcon("Grid")
export const Grid2x2 = createMockIcon("Grid2x2")
export const Grid2X2 = createMockIcon("Grid2X2")
export const Grid3X3 = createMockIcon("Grid3X3")
export const GripVertical = createMockIcon("GripVertical")
export const GripVerticalIcon = createMockIcon("GripVerticalIcon")
export const HardDrive = createMockIcon("HardDrive")
export const Hash = createMockIcon("Hash")
export const Headphones = createMockIcon("Headphones")
export const History = createMockIcon("History")
export const Image = createMockIcon("Image")
export const ImagePlay = createMockIcon("ImagePlay")
export const Info = createMockIcon("Info")
export const Keyboard = createMockIcon("Keyboard")
export const Languages = createMockIcon("Languages")
export const LayoutDashboard = createMockIcon("LayoutDashboard")
export const LayoutGrid = createMockIcon("LayoutGrid")
export const LayoutTemplate = createMockIcon("LayoutTemplate")
export const Layers = createMockIcon("Layers")
export const List = createMockIcon("List")
export const ListTodo = createMockIcon("ListTodo")
export const Loader2 = createMockIcon("Loader2")
export const Lock = createMockIcon("Lock")
export const Magnet = createMockIcon("Magnet")
export const Maximize2 = createMockIcon("Maximize2")
export const Mic = createMockIcon("Mic")
export const Minimize2 = createMockIcon("Minimize2")
export const Minus = createMockIcon("Minus")
export const MessageSquare = createMockIcon("MessageSquare")
export const Monitor = createMockIcon("Monitor")
export const MonitorCog = createMockIcon("MonitorCog")
export const Moon = createMockIcon("Moon")
export const Move = createMockIcon("Move")
export const MousePointer = createMockIcon("MousePointer")
export const MoveHorizontal = createMockIcon("MoveHorizontal")
export const Music = createMockIcon("Music")
export const Music2 = createMockIcon("Music2")
export const Package = createMockIcon("Package")
export const Palette = createMockIcon("Palette")
export const PanelBottomClose = createMockIcon("PanelBottomClose")
export const PanelBottomOpen = createMockIcon("PanelBottomOpen")
export const PanelLeft = createMockIcon("PanelLeft")
export const PanelLeftClose = createMockIcon("PanelLeftClose")
export const PanelLeftOpen = createMockIcon("PanelLeftOpen")
export const PanelRightClose = createMockIcon("PanelRightClose")
export const PanelRightOpen = createMockIcon("PanelRightOpen")
export const PanelTop = createMockIcon("PanelTop")
export const Pause = createMockIcon("Pause")
export const Play = createMockIcon("Play")
export const PlayCircle = createMockIcon("PlayCircle")
export const Plus = createMockIcon("Plus")
export const Power = createMockIcon("Power")
export const Redo = createMockIcon("Redo")
export const Redo2 = createMockIcon("Redo2")
export const RefreshCw = createMockIcon("RefreshCw")
export const RotateCcw = createMockIcon("RotateCcw")
export const Save = createMockIcon("Save")
export const Scissors = createMockIcon("Scissors")
export const Search = createMockIcon("Search")
export const Send = createMockIcon("Send")
export const Settings = createMockIcon("Settings")
export const Settings2 = createMockIcon("Settings2")
export const Sliders = createMockIcon("Sliders")
export const Circle = createMockIcon("Circle")
export const Sparkles = createMockIcon("Sparkles")
export const Speaker = createMockIcon("Speaker")
export const Split = createMockIcon("Split")
export const Square = createMockIcon("Square")
export const SquareMousePointer = createMockIcon("SquareMousePointer")
export const Star = createMockIcon("Star")
export const StepBack = createMockIcon("StepBack")
export const StepForward = createMockIcon("StepForward")
export const Sticker = createMockIcon("Sticker")
export const StickyNote = createMockIcon("StickyNote")
export const StopCircle = createMockIcon("StopCircle")
export const Tag = createMockIcon("Tag")
export const Target = createMockIcon("Target")
export const Subtitles = createMockIcon("Subtitles")
export const Sun = createMockIcon("Sun")
export const Trash2 = createMockIcon("Trash2")
export const TrendingDown = createMockIcon("TrendingDown")
export const TrendingUp = createMockIcon("TrendingUp")
export const TvMinimalPlay = createMockIcon("TvMinimalPlay")
export const Type = createMockIcon("Type")
export const Undo = createMockIcon("Undo")
export const Undo2 = createMockIcon("Undo2")
export const UnfoldHorizontal = createMockIcon("UnfoldHorizontal")
export const Unlock = createMockIcon("Unlock")
export const Upload = createMockIcon("Upload")
export const User = createMockIcon("User")
export const UserCog = createMockIcon("UserCog")
export const Users = createMockIcon("Users")
export const Video = createMockIcon("Video")
export const Volume2 = createMockIcon("Volume2")
export const VolumeX = createMockIcon("VolumeX")
export const Waves = createMockIcon("Waves")
export const RadioIcon = createMockIcon("RadioIcon")
export const Shuffle = createMockIcon("Shuffle")
export const Wand2 = createMockIcon("Wand2")
export const Webcam = createMockIcon("Webcam")
export const X = createMockIcon("X")
export const XCircle = createMockIcon("XCircle")
export const XIcon = createMockIcon("XIcon")
export const Zap = createMockIcon("Zap")
export const Youtube = createMockIcon("Youtube")
// J/L Cut icons
export const Link2 = createMockIcon("Link2")
export const Unlink2 = createMockIcon("Unlink2")
export const ScissorsLineDashed = createMockIcon("ScissorsLineDashed")

// Mock the entire lucide-react module
vi.mock("lucide-react", () => ({
  Activity,
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  ArrowLeftRight,
  ArrowRight,
  AudioLines,
  Blend,
  Bookmark,
  Bot,
  Brain,
  BarChart3,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckIcon,
  CheckSquare,
  ChevronDown,
  ChevronDownIcon,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleDot,
  CircleIcon,
  CirclePause,
  CirclePlay,
  Clapperboard,
  Clock,
  Copy,
  CopyPlus,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  File,
  FileAudio,
  FileImage,
  FilePlus,
  FileText,
  FileVideo,
  Film,
  Filter,
  FlipHorizontal2,
  Folder,
  FolderClosed,
  FolderOpen,
  Gauge,
  GitBranch,
  GitCommit,
  Globe,
  Grid,
  Grid2x2,
  Grid2X2,
  Grid3X3,
  GripVertical,
  GripVerticalIcon,
  HardDrive,
  Hash,
  Headphones,
  History,
  Image,
  ImagePlay,
  Info,
  Keyboard,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Layers,
  List,
  ListTodo,
  Loader2,
  Lock,
  Magnet,
  Maximize2,
  Mic,
  Minimize2,
  Minus,
  MessageSquare,
  Monitor,
  MonitorCog,
  Moon,
  Move,
  MousePointer,
  MoveHorizontal,
  Music,
  Music2,
  Package,
  Palette,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelTop,
  Pause,
  Play,
  PlayCircle,
  Plus,
  Power,
  Redo,
  Redo2,
  RefreshCw,
  RotateCcw,
  RadioIcon,
  Save,
  Scissors,
  Search,
  Send,
  Settings,
  Settings2,
  Shuffle,
  Sliders,
  Speaker,
  Circle,
  Sparkles,
  Split,
  Square,
  SquareMousePointer,
  Star,
  StepBack,
  StepForward,
  Sticker,
  StickyNote,
  StopCircle,
  Tag,
  Target,
  Subtitles,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  TvMinimalPlay,
  Type,
  Undo,
  Undo2,
  UnfoldHorizontal,
  Unlock,
  Upload,
  User,
  UserCog,
  Users,
  Video,
  Volume2,
  VolumeX,
  Waves,
  Wand2,
  Webcam,
  X,
  XCircle,
  XIcon,
  Zap,
  Youtube,
  // J/L Cut icons
  Link2,
  Unlink2,
  ScissorsLineDashed,
}))

// Helper to create custom icons for tests
export { createMockIcon }
