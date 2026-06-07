import { Sprout, Star, Trash2 } from "lucide-react";
import { DsPageHeader, DsSection, DsCanvas } from "../_components/showcase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ComponentsPage() {
  return (
    <>
      <DsPageHeader
        title="Components"
        lead="Production-ready, accessible, and fully themed to the Triveni design system. Every control has a visible focus state and uses semantic tokens."
      />

      {/* BUTTONS */}
      <DsSection title="Button" description="Variants and sizes.">
        <DsCanvas>
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">
            <Trash2 /> Delete
          </Button>
        </DsCanvas>
        <DsCanvas className="mt-sp-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Favorite">
            <Star />
          </Button>
          <Button disabled>Disabled</Button>
        </DsCanvas>
      </DsSection>

      {/* BADGES */}
      <DsSection title="Badge" description="Status and labels.">
        <DsCanvas>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="soft">Soft</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Open</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger">Closed</Badge>
        </DsCanvas>
      </DsSection>

      {/* CARD */}
      <DsSection title="Card">
        <div className="grid gap-sp-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Static card</CardTitle>
              <CardDescription>
                A surface for grouping related content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body text-soft">
                Built from semantic tokens — surface, ink, line, and shadow.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="primary">
                Action
              </Button>
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
            </CardFooter>
          </Card>
          <Card interactive>
            <CardHeader>
              <span className="mb-sp-1 inline-flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                <Sprout className="size-5" />
              </span>
              <CardTitle>Interactive card</CardTitle>
              <CardDescription>Lifts on hover & focus-within.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DsSection>

      {/* FORM CONTROLS */}
      <DsSection title="Inputs & forms">
        <DsCanvas className="flex-col items-stretch sm:max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="Aarav Sharma" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@school.edu.np" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade">Grade</Label>
            <Select>
              <SelectTrigger id="grade">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Grade 6</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="msg">Message</Label>
            <Textarea id="msg" placeholder="Share your suggestion…" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bad">Invalid example</Label>
            <Input id="bad" aria-invalid defaultValue="not-an-email" />
          </div>
        </DsCanvas>
      </DsSection>

      {/* OVERLAYS */}
      <DsSection
        title="Overlays"
        description="Dialog (centered modal) and Drawer (bottom sheet, great on mobile)."
      >
        <DsCanvas>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="primary">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join this activity?</DialogTitle>
                <DialogDescription>
                  You&apos;ll be added to the participant list and notified about
                  updates.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="primary">Confirm</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
                <DrawerDescription>
                  Refine the activities list.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <Button variant="primary">Apply</Button>
                <DrawerClose asChild>
                  <Button variant="ghost">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DsCanvas>
      </DsSection>

      {/* TABS */}
      <DsSection title="Tabs">
        <Tabs defaultValue="about">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="about">
            <p className="text-body text-soft">
              Overview of the club, its mission, and history.
            </p>
          </TabsContent>
          <TabsContent value="members">
            <p className="text-body text-soft">The committee and members list.</p>
          </TabsContent>
          <TabsContent value="events">
            <p className="text-body text-soft">Upcoming and past events.</p>
          </TabsContent>
        </Tabs>
      </DsSection>

      {/* AVATAR */}
      <DsSection title="Avatar">
        <DsCanvas>
          <Avatar size="sm">
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <Avatar size="md">
            <AvatarFallback>TR</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarImage src="/avatar-placeholder.png" alt="" />
            <AvatarFallback>PK</AvatarFallback>
          </Avatar>
          <Avatar size="xl">
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </DsCanvas>
      </DsSection>

      {/* TABLE */}
      <DsSection title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold">Aarav Sharma</TableCell>
              <TableCell>10</TableCell>
              <TableCell>President</TableCell>
              <TableCell>
                <Badge variant="success">Active</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Priya Karki</TableCell>
              <TableCell>9</TableCell>
              <TableCell>Secretary</TableCell>
              <TableCell>
                <Badge variant="success">Active</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Sita Chaudhary</TableCell>
              <TableCell>8</TableCell>
              <TableCell>Member</TableCell>
              <TableCell>
                <Badge variant="warning">Pending</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DsSection>

      {/* BREADCRUMB */}
      <DsSection title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/design-system">Design System</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Components</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DsSection>

      {/* PAGINATION */}
      <DsSection title="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </DsSection>
    </>
  );
}
