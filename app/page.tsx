import { readFileSync } from 'fs'
import { join } from 'path'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  ShieldAlert,
  Activity,
  Calendar,
  Users,
  ChevronRight,
  Zap
} from 'lucide-react'

interface Task {
  text: string
  date?: string
  details?: string
}

interface DashboardData {
  active: Task[]
  waiting: Task[]
  completed: Task[]
  backlog: Task[]
  blocked: Task[]
  notes: { date: string; item: string; note: string }[]
  lastUpdated: string
}

function parseMissionControl(): DashboardData {
  const filePath = join(process.cwd(), 'data', 'MISSION_CONTROL.md')
  const content = readFileSync(filePath, 'utf-8')
  
  const data: DashboardData = {
    active: [],
    waiting: [],
    completed: [],
    backlog: [],
    blocked: [],
    notes: [],
    lastUpdated: ''
  }

  // Extract last updated date
  const lastUpdatedMatch = content.match(/_Last updated: (.+)_/)
  if (lastUpdatedMatch) {
    data.lastUpdated = lastUpdatedMatch[1]
  }

  // Parse sections
  const sections = {
    active: /## 🔴 Active Tasks[\s\S]*?(?=## 🟡|$)/,
    waiting: /## 🟡 Waiting for Owner Review[\s\S]*?(?=## ✅|$)/,
    completed: /## ✅ Completed \(last 7 days\)[\s\S]*?(?=## 📋|$)/,
    backlog: /## 📋 Backlog[\s\S]*?(?=## 🚫|$)/,
    blocked: /## 🚫 Blocked[\s\S]*?(?=## 📝|$)/,
  }

  // Parse tasks from each section
  Object.entries(sections).forEach(([key, regex]) => {
    const match = content.match(regex)
    if (match) {
      const sectionContent = match[0]
      const taskMatches = sectionContent.matchAll(/- \[.?\] (.+)/g)
      for (const taskMatch of taskMatches) {
        const taskText = taskMatch[1].trim()
        
        // Check for date prefix in completed tasks
        const dateMatch = taskText.match(/\[(\d{4}-\d{2}-\d{2})\] (.+)/)
        if (dateMatch && key === 'completed') {
          data[key as keyof Omit<DashboardData, 'notes' | 'lastUpdated'>].push({
            text: dateMatch[2],
            date: dateMatch[1]
          })
        } else if (taskText !== '_(Tasks currently being worked on)_' && 
                   taskText !== '_(Completed work pending approval before use)_' &&
                   taskText !== '_(Finished and approved items)_' &&
                   taskText !== '_(Queued work not yet started)_' &&
                   taskText !== '_(Items waiting on external factors or owner decisions)_' &&
                   taskText !== 'Nothing yet.' &&
                   taskText !== 'Nothing blocked.') {
          data[key as keyof Omit<DashboardData, 'notes' | 'lastUpdated'>].push({
            text: taskText
          })
        }
      }
    }
  })

  // Parse notes table
  const notesMatch = content.match(/## 📝 Notes & Decisions Log[\s\S]*?\| Date \| Item \| Decision\/Note \|[\s\S]*?(?=##|$)/)
  if (notesMatch) {
    const tableLines = notesMatch[0].split('\n').slice(3) // Skip header and separator
    for (const line of tableLines) {
      const cells = line.match(/\| (.+?) \| (.+?) \| (.+?) \|/)
      if (cells && cells[1] !== '------') {
        data.notes.push({
          date: cells[1].trim(),
          item: cells[2].trim(),
          note: cells[3].trim()
        })
      }
    }
  }

  return data
}

export default async function Dashboard() {
  const data = parseMissionControl()
  
  const stats = [
    { label: 'Active', count: data.active.length, icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Waiting', count: data.waiting.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Completed', count: data.completed.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Backlog', count: data.backlog.length, icon: ListTodo, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  ]

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Evernu Mission Control</h1>
            </div>
            <p className="text-evernu-muted">Productivity dashboard for Evernu.co.uk</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-evernu-muted bg-evernu-card px-4 py-2 rounded-lg">
            <Calendar className="w-4 h-4" />
            Last updated: {data.lastUpdated}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-evernu-card rounded-xl p-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.count}</p>
                  <p className="text-sm text-evernu-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Tasks */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Active Tasks</h2>
              <span className="ml-auto text-sm text-red-500 font-medium">{data.active.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {data.active.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">No active tasks</p>
              ) : (
                data.active.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-white text-sm">{task.text}</p>
                      <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Waiting for Review */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Waiting for Review</h2>
              <span className="ml-auto text-sm text-amber-500 font-medium">{data.waiting.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {data.waiting.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">Nothing waiting for review</p>
              ) : (
                data.waiting.map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <p className="text-white text-sm">{task.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Completed (Last 7 Days)</h2>
              <span className="ml-auto text-sm text-emerald-500 font-medium">{data.completed.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {data.completed.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">No completed tasks</p>
              ) : (
                data.completed.map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-white text-sm">{task.text}</p>
                      <p className="text-xs text-evernu-muted mt-1">{task.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Backlog */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Backlog</h2>
              <span className="ml-auto text-sm text-slate-400 font-medium">{data.backlog.length}</span>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {data.backlog.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">No backlog items</p>
              ) : (
                data.backlog.map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-500 text-xs mt-1">{i + 1}.</span>
                    <p className="text-slate-300 text-sm">{task.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Blocked & Notes */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Blocked */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Blocked</h2>
              <span className="ml-auto text-sm text-red-500 font-medium">{data.blocked.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {data.blocked.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">Nothing blocked</p>
              ) : (
                data.blocked.map((task, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5" />
                    <p className="text-white text-sm">{task.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Notes */}
          <div className="bg-evernu-card rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-white">Notes & Decisions</h2>
            </div>
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {data.notes.length === 0 ? (
                <p className="text-evernu-muted text-sm italic">No notes</p>
              ) : (
                data.notes.slice(-5).reverse().map((note, i) => (
                  <div key={i} className="border-l-2 border-blue-500/30 pl-4">
                    <p className="text-xs text-evernu-muted mb-1">{note.date} — {note.item}</p>
                    <p className="text-slate-300 text-sm">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-evernu-muted pt-4 border-t border-slate-800">
          <p>Evernu Dashboard • Auto-generated from MISSION_CONTROL.md</p>
        </div>
      </div>
    </main>
  )
}
