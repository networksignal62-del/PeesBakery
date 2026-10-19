"use client"

interface Category {
  id: string
  name: string
  display_order?: number
  is_active?: boolean
}

interface CategoryFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories?: Category[]
}

export function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
}: CategoryFilterProps) {
  const displayCategories = [{ id: 'all', name: 'All Items' }, ...(categories || []).filter(category => category.id !== 'all')]

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId)
  }

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {displayCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => handleCategoryClick(category.id)}
          className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-medium whitespace-nowrap transition-all duration-200 text-sm md:text-base ${
            selectedCategory === category.id
              ? "bg-[#014325] text-white shadow-md"
              : "bg-white text-[#0f1419] border border-[#e5e7e8] hover:border-[#014325]"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
