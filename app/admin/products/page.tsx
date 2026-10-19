"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/lib/actions/products"
import { AdminHeader } from "@/components/admin/admin-header"

const CATEGORIES = [
  { id: "african", label: "African Dishes" },
  { id: "bakery", label: "Bakery & Cakes" },
  { id: "fast-food", label: "Burgers & Shawarma" },
  { id: "drinks", label: "Drinks & Desserts" },
]

const emptyForm = {
  name: "",
  category: "african",
  price: "",
  image: "",
  description: "",
  longDescription: "",
  featured: false,
  isActive: true,
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [filterCategory, setFilterCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [adminName, setAdminName] = useState("Admin")

  const loadProducts = useCallback(async () => {
    const { data } = await getAdminProducts()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/admin/login"); return }
      supabase.from("admin_profiles").select("full_name").eq("id", data.user.id).single()
        .then(({ data: p }) => { if (p?.full_name) setAdminName(p.full_name) })
    })
    loadProducts()
  }, [router, loadProducts])

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (product: any) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      image: product.image ?? "",
      description: product.description ?? "",
      longDescription: product.long_description ?? "",
      featured: product.featured ?? false,
      isActive: product.is_active ?? true,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: parseFloat(form.price),
      image: form.image.trim() || undefined,
      description: form.description.trim() || undefined,
      longDescription: form.longDescription.trim() || undefined,
      featured: form.featured,
      isActive: form.isActive,
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload)
    } else {
      await createProduct(payload)
    }

    await loadProducts()
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    await deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
  }

  const handleToggleActive = async (product: any) => {
    await toggleProductActive(product.id, !product.is_active)
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    )
  }

  const filtered = products.filter((p) => {
    const matchCat = filterCategory === "all" || p.category === filterCategory
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-[#f6f8f5] font-sans">
      <AdminHeader adminName={adminName} active="products" />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-[#0f1419]">Products</h1>
          <button
            onClick={openCreate}
            className="bg-[#014325] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#012d19] transition-colors"
          >
            + Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325] bg-white"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterCategory === "all" ? "bg-[#014325] text-white" : "bg-white border border-[#e5e7e8] text-[#5c6466]"}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCategory(c.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterCategory === c.id ? "bg-[#014325] text-white" : "bg-white border border-[#e5e7e8] text-[#5c6466]"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products table */}
        <div className="bg-white rounded-xl border border-[#e5e7e8] overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-[#5c6466]">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-[#5c6466]">No products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f8f9fa] border-b border-[#e5e7e8]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5c6466] uppercase">Product</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5c6466] uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5c6466] uppercase">Price</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#5c6466] uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6466] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f3]">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image && (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#f0f2f3] shrink-0">
                              <Image src={product.image} alt={product.name} fill className="object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[#0f1419]">{product.name}</p>
                            {product.featured && (
                              <span className="text-xs text-amber-600 font-medium">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-[#f0f2f3] text-[#5c6466] px-2 py-1 rounded-full capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#014325]">
                        Le {Number(product.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${product.is_active ? "bg-[#014325]" : "bg-[#d1d5db]"}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${product.is_active ? "translate-x-4.5" : "translate-x-0.5"}`}
                          />
                        </button>
                        <span className="ml-2 text-xs text-[#5c6466]">{product.is_active ? "Active" : "Hidden"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#f0f2f3] text-[#0f1419] rounded-lg hover:bg-[#e5e7e8] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Product Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#e5e7e8] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg">{editingProduct ? "Edit Product" : "Add New Product"}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-[#f0f2f3] flex items-center justify-center text-[#5c6466] hover:bg-[#e5e7e8]"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Product Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325]"
                  placeholder="e.g. Whole Chicken"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Price (Le) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Image Path</label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325]"
                  placeholder="/images/my-product.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325]"
                  placeholder="Brief description shown in listings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f1419] mb-1.5">Full Description</label>
                <textarea
                  rows={3}
                  value={form.longDescription}
                  onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#014325] resize-none"
                  placeholder="Full description shown on product page"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="w-4 h-4 accent-[#014325]"
                  />
                  <span className="text-sm text-[#0f1419]">Featured product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#014325]"
                  />
                  <span className="text-sm text-[#0f1419]">Active (visible to customers)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm font-medium text-[#0f1419] hover:bg-[#f0f2f3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#014325] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#012d19] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h3 className="font-bold text-lg text-[#0f1419] mb-2">Delete Product?</h3>
            <p className="text-sm text-[#5c6466] mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-[#e5e7e8] rounded-lg text-sm font-medium text-[#0f1419] hover:bg-[#f0f2f3] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
