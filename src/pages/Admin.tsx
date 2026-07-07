import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdminSolutions } from "@/components/admin/AdminSolutions";
import { AdminCollaterals } from "@/components/admin/AdminCollaterals";
import { AdminLogs } from "@/components/admin/AdminLogs";
import { AdminUsers } from "@/components/admin/AdminUsers";

const Admin = () => {
  return (
    <Layout>
      

      <section className="container py-8">
        <h1 className="mb-1 font-display text-3xl font-bold">
          Admin - {" "}
          <span className="font-sans text-base font-normal text-muted-foreground">
            Manage Solutions, Collaterals, and view activity logs.
          </span>
        </h1>

        <Tabs defaultValue="solutions">
          <TabsList>
            <TabsTrigger value="solutions">Solutions</TabsTrigger>
            <TabsTrigger value="collaterals">Collaterals</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="solutions" className="mt-6">
            <AdminSolutions />
          </TabsContent>
          <TabsContent value="collaterals" className="mt-6">
            <AdminCollaterals />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <AdminLogs />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <AdminUsers />
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Admin;
