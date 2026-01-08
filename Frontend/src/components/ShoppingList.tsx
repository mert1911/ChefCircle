import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Download } from "lucide-react";
import { shoppingListAPI } from "@/lib/api";
import { getCurrentWeek } from "@/lib/utils";

const ShoppingList = () => {
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Remove showAll and VISIBLE_COUNT state

  const currentWeek = useMemo(() => getCurrentWeek(), []);

  const fetchShoppingList = async () => {
    try {
      setError(null);
      const shoppingData = await shoppingListAPI.getShoppingList(currentWeek);
      setShoppingList(shoppingData);
    } catch (err: any) {
      setError(err.message || 'Failed to load shopping list');
      setShoppingList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, [currentWeek]);

  const handleShoppingListCheck = async (ingredientId: string, unit: string, checked: boolean) => {
    try {
      const updatedList = await shoppingListAPI.updateChecked(ingredientId, unit, checked);
      setShoppingList(updatedList);
    } catch (err) {
      alert('Failed to update shopping list item.');
    }
  };

  const downloadShoppingList = () => {
    if (shoppingList.length === 0) {
      alert('No items in shopping list to download');
      return;
    }
    const csvHeader = 'Ingredient,Amount,Unit,Checked\n';
    const csvRows = shoppingList.map(item => 
      `"${item.name}",${item.amount},"${item.unit}",${item.checked ? 'Yes' : 'No'}`
    ).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shopping-list-${currentWeek}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="border-emerald-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-lg font-semibold text-gray-900">Shopping List</CardTitle>
        </div>
        {shoppingList.length > 0 && (
          <Button 
            onClick={downloadShoppingList}
            variant="outline" 
            size="sm" 
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span className="ml-2 text-gray-600">Loading shopping list...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-red-500 mb-2">Error loading shopping list</p>
            <p className="text-sm text-gray-500 mb-3">{error}</p>
            <button 
              onClick={fetchShoppingList}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Try again
            </button>
          </div>
        ) : shoppingList.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No items in your shopping list.</p>
            <p className="text-sm text-gray-400 mt-1">Plan your meals to generate a shopping list</p>
          </div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {shoppingList.map((item, index) => (
              <li key={`${item.ingredientId}-${item.unit}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={e => handleShoppingListCheck(item.ingredientId, item.unit, e.target.checked)}
                  className="accent-emerald-600 h-4 w-4"
                />
                <span className={`flex-1 ${item.checked ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {item.name}
                </span>
                <span className={`text-sm ${item.checked ? "text-gray-400" : "text-gray-600"}`}>
                  {item.amount} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingList; 