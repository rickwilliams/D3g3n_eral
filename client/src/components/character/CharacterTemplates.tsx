/**
 * CharacterTemplates Component
 * 
 * This component handles the templates section of the character form,
 * allowing users to create, edit, and delete templates.
 */
import { useState } from "react";
import { CharacterFormValues } from "@/types/character";
import { useCharacterTemplates, Template } from "@/hooks/useCharacterTemplates";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash, Save, X } from "lucide-react";

interface CharacterTemplatesProps {
  form: any; // Using any to avoid TypeScript errors with UseFormReturn
}

/**
 * Component for managing character templates
 * 
 * @param form - The form instance from useCharacterForm
 */
export function CharacterTemplates({ form }: CharacterTemplatesProps) {
  const {
    activeTemplate,
    setActiveTemplate,
    isEditing,
    setIsEditing,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    renameTemplate,
  } = useCharacterTemplates(form);
  
  const [newTemplateName, setNewTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Get all templates from the form
  const templates = getTemplates();
  
  // Handle creating a new template
  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    
    const id = addTemplate(newTemplateName);
    setNewTemplateName("");
    setActiveTemplate(id);
    setIsEditing(true);
    setTemplateContent("");
  };
  
  // Handle editing an existing template
  const handleEditTemplate = (id: string) => {
    const template = getTemplate(id);
    if (template) {
      setActiveTemplate(id);
      setIsEditing(true);
      setTemplateContent(template.content);
    }
  };
  
  // Handle saving template changes
  const handleSaveTemplate = () => {
    if (activeTemplate) {
      updateTemplate(activeTemplate, templateContent);
      setIsEditing(false);
    }
  };
  
  // Handle canceling template editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    const template = activeTemplate ? getTemplate(activeTemplate) : null;
    if (template) {
      setTemplateContent(template.content);
    }
  };
  
  // Handle deleting a template
  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Templates</h3>
        {!isCreating ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsCreating(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              className="w-48"
            />
            <Button 
              size="sm" 
              onClick={handleCreateTemplate}
            >
              Add
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsCreating(false);
                setNewTemplateName("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
      
      {templates.length === 0 ? (
        <div className="text-center p-6 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No templates yet. Add your first template to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Template list */}
          {!isEditing && (
            templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {template.content || "Empty template"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditTemplate(template.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
          
          {/* Template editor */}
          {isEditing && activeTemplate && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {getTemplate(activeTemplate)?.name || "Template"}
                </CardTitle>
                <CardDescription>
                  Edit your template content below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  className="min-h-[200px]"
                  placeholder="Enter template content..."
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveTemplate}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 