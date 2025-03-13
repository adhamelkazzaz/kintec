"use client";

import { useState } from "react";
import {
  useRpoRules,
  useDeleteRpoRule,
  useCreateRpoRule,
} from "@/hooks/useRpoRules";
import { DataTable } from "@/components/dataTable/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Trash2, Upload, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { RPO_Rule } from "@/types/Orders";
import { toast } from "sonner";
import { parseRpoRule } from "@/lib/csv/rpoRule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CSVPreviewDialog } from "@/components/csvPreviewDialog/RpoRule";
import { PoRuleForm } from "@/components/forms/PoRule";
import { PoRuleDetails } from "@/components/detailsDialogs/PoRule";

export function PoRule() {
  const { data: poRules = [], isLoading } = useRpoRules();
  const deletePoRule = useDeleteRpoRule();
  const createPoRule = useCreateRpoRule();

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RPO_Rule | null>(null);

  // CSV upload state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [csvData, setCsvData] = useState<Partial<RPO_Rule>[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    { row: number; error: string }[]
  >([]);

  const handleAddClick = () => {
    setSelectedRuleId(null);
    setIsFormDialogOpen(true);
  };

  const handleEditClick = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setIsFormDialogOpen(true);
  };

  const handleViewDetails = (rule: RPO_Rule) => {
    setSelectedRule(rule);
    setViewDetailsOpen(true);
  };

  const handleDeleteClick = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setIsFormDialogOpen(false);
  };

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deletePoRule.mutateAsync(ruleToDelete);
      toast.success("PO Rule deleted successfully");
    } catch (error) {
      toast.error("Failed to delete PO Rule");
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseRpoRule(file);
      setCsvFileName(file.name);
      setCsvData(result.data);

      // Validate data
      const errors: { row: number; error: string }[] = [];
      result.data.forEach((item, index) => {
        if (!item.PO_id) {
          errors.push({
            row: index + 1,
            error: "Purchase Order ID is required",
          });
        }
      });

      setValidationErrors(errors);

      // Show preview dialog
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      // Reset the file input
      event.target.value = "";
    }
  };

  // Handle CSV data import confirmation
  const handleConfirmCsvUpload = async () => {
    try {
      // Process each rule one by one
      for (const rule of csvData) {
        await createPoRule.mutateAsync(rule as any);
      }

      toast.success(`Successfully imported ${csvData.length} PO rules`);
      return Promise.resolve();
    } catch (error) {
      console.error("Error importing CSV data:", error);
      toast.error("Failed to import PO rules from CSV");
      return Promise.reject(error);
    }
  };

  const columns: ColumnDef<RPO_Rule>[] = [
    {
      accessorKey: "RPO_rule_id",
      header: "Rule ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("RPO_rule_id")}</div>
      ),
    },
    {
      accessorKey: "PO_id",
      header: "PO ID",
      cell: ({ row }) => {
        return (
          <div className="font-mono text-xs">
            {row.original.PO_id || row.getValue("PO_id")}
          </div>
        );
      },
    },
    {
      accessorKey: "RPO_number_format",
      header: "Number Format",
      cell: ({ row }) => <div>{row.getValue("RPO_number_format") || "—"}</div>,
    },
    {
      accessorKey: "final_invoice_label",
      header: "Final Invoice Label",
      cell: ({ row }) => (
        <div>{row.getValue("final_invoice_label") || "—"}</div>
      ),
    },
    {
      accessorKey: "RPO_extension_handling",
      header: "Extension Handling",
      cell: ({ row }) => (
        <div>{row.getValue("RPO_extension_handling") || "—"}</div>
      ),
    },
    {
      accessorKey: "mob_demob_fee_rules",
      header: "Mob/Demob Fee Rules",
      cell: ({ row }) => (
        <div>{row.getValue("mob_demob_fee_rules") || "—"}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditClick(row.original.RPO_rule_id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteClick(row.original.RPO_rule_id)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewDetails(row.original)}
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredData = poRules.filter(
    (rule) =>
      rule.PO_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.RPO_number_format || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rule.final_invoice_label || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rule.RPO_extension_handling || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (rule.mob_demob_fee_rules || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Purchase Order Rules Management
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add PO Rule
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            className="pl-10"
            placeholder="Search PO rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        pageSize={10}
      />

      {/* Add/Edit Form Dialog */}
      <PoRuleForm
        ruleId={selectedRuleId || undefined}
        open={isFormDialogOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* View Details Dialog */}
      {selectedRule && (
        <PoRuleDetails
          poRule={selectedRule}
          open={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the PO
              rule and may affect related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Preview Dialog */}
      <CSVPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={csvData}
        fileName={csvFileName}
        onConfirm={handleConfirmCsvUpload}
        validationErrors={validationErrors}
      />
    </div>
  );
}
