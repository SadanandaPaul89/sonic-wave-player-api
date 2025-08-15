
import React, { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { CustomColorDemo } from "@/components/ExpandedTabsDemo";
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  FileText, 
  Activity 
} from "lucide-react";
import { ExpandedTabs } from "@/components/ui/expanded-tabs";

const ProfilePage = () => {
  const [activeSection, setActiveSection] = useState(0);

  const profileTabs = [
    { title: "Personal Info", icon: User },
    { title: "Account Settings", icon: Settings },
    { type: "separator" as const },
    { title: "Privacy & Security", icon: Shield },
    { title: "Notifications", icon: Bell },
    { title: "Activity Log", icon: Activity },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 0:
        return <ProfileForm />;
      case 1:
        return <div className="p-6 bg-card rounded-lg border">Account settings coming soon...</div>;
      case 3:
        return <div className="p-6 bg-card rounded-lg border">Privacy & Security settings...</div>;
      case 4:
        return <div className="p-6 bg-card rounded-lg border">Notification preferences...</div>;
      case 5:
        return <div className="p-6 bg-card rounded-lg border">Your activity history...</div>;
      default:
        return <ProfileForm />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Profile Settings</h2>
            <ExpandedTabs
              tabs={profileTabs}
              onTabChange={setActiveSection}
              activeColor="text-primary"
            />
            
            <div className="mt-8">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Quick Actions</h3>
              <CustomColorDemo />
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
