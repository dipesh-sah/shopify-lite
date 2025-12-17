"use client"

import { useState, useEffect } from 'react'
import { getUsersAction, createUserAction, updateUserAction, deleteUserAction, getRolesAction } from '@/actions/users'
import { Plus, Pencil, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  status: string
  roleName: string
  createdAt: string
}

interface Role {
  id: string
  name: string
}

export function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    password: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [usersData, rolesData] = await Promise.all([
        getUsersAction(),
        getRolesAction()
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to load users', error)
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(user: AdminUser) {
    setEditingUser(user)
    // Find role ID from name (simplified for demo, ideally we have roleId in user object)
    const role = roles.find(r => r.name === user.roleName)

    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: role?.id || '',
      password: ''
    })
    setIsModalOpen(true)
  }

  function handleAddNew() {
    setEditingUser(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      roleId: '',
      password: ''
    })
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingUser) {
        await updateUserAction(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          roleId: formData.roleId,
          password: formData.password || undefined
        })
      } else {
        await createUserAction(formData)
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error('Operation failed', error)
      alert('Operation failed. Check permissions.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUserAction(id)
      loadData()
    } catch (error) {
      console.error('Delete failed', error)
      alert('Delete failed')
    }
  }

  if (loading) return <div className="p-8">Loading users...</div>

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">User Management</h2>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="relative w-full overflow-auto flex-1">
          <table className="w-full caption-bottom text-sm h-full">
            <thead className="[&_tr]:border-b sticky top-0 bg-secondary/50 backdrop-blur z-10">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0 bg-background">
              {users.map((user) => (
                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] z-50">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.roleId}
                onValueChange={(val: string) => setFormData({ ...formData, roleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  {/* Increase z-index for select dropdown inside modal */}
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Password {editingUser && '(Leave blank to keep current)'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
