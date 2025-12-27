"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatClubDate, formatClubTime } from "@/lib/timezone";

/**
 * Event Clone Page
 *
 * Allows event chairs/admins to clone an existing event to a new date.
 * Features:
 * - Display original event details
 * - New date/time picker
 * - Capacity adjustment
 * - Keep/reset registrations toggle
 * - Keep ticket pricing toggle
 * - Clone as Draft button
 *
 * Charter: P5 (Every important action must be undoable or reversible)
 */

type TicketTier = {
  id: string;
  name: string;
  price: number;
  capacity: number;
};

type OriginalEvent = {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  capacity: number;
  registrationCount: number;
  ticketTiers: TicketTier[];
};

// Demo data for the original event
const DEMO_EVENT: OriginalEvent = {
  id: "evt-123",
  title: "Wine Tasting Tour - Santa Ynez Valley",
  description:
    "Join us for a delightful day exploring the beautiful wineries of Santa Ynez Valley. We'll visit three award-winning wineries with guided tastings at each.",
  startTime: new Date("2025-01-15T09:00:00"),
  endTime: new Date("2025-01-15T16:00:00"),
  location: "Meet at Fess Parker Winery, 6200 Foxen Canyon Rd",
  capacity: 40,
  registrationCount: 28,
  ticketTiers: [
    { id: "tier-1", name: "Member", price: 45, capacity: 30 },
    { id: "tier-2", name: "Guest", price: 55, capacity: 10 },
  ],
};

export default function EventClonePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [newStartDate, setNewStartDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("16:00");
  const [newCapacity, setNewCapacity] = useState(DEMO_EVENT.capacity.toString());
  const [keepRegistrations, setKeepRegistrations] = useState(false);
  const [keepTicketPricing, setKeepTicketPricing] = useState(true);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [newEventId, setNewEventId] = useState<string | null>(null);

  const originalEvent = DEMO_EVENT;

  const handleClone = async () => {
    if (!newStartDate) {
      alert("Please select a new date for the cloned event");
      return;
    }

    setIsCloning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const clonedEventId = `evt-${Date.now()}`;
    setNewEventId(clonedEventId);
    setCloneSuccess(true);
    setIsCloning(false);
  };

  const handleGoToNewEvent = () => {
    if (newEventId) {
      router.push(`/admin/events/${newEventId}`);
    }
  };

  if (cloneSuccess && newEventId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Event Cloned Successfully!</h1>
          <p className="text-green-700 mb-6">
            Your new event has been created as a draft. You can now edit it before publishing.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleGoToNewEvent}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              Go to New Event
            </button>
            <Link
              href="/admin/events"
              className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
          &larr; Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Clone Event</h1>
        <p className="text-gray-600 mt-1">
          Create a copy of this event with a new date. The cloned event will be saved as a draft.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Original Event Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Event</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{originalEvent.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{originalEvent.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium text-gray-900">{formatClubDate(originalEvent.startTime)}</p>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <p className="font-medium text-gray-900">
                  {formatClubTime(originalEvent.startTime)} - {formatClubTime(originalEvent.endTime)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <p className="font-medium text-gray-900">{originalEvent.location}</p>
              </div>
              <div>
                <span className="text-gray-500">Capacity:</span>
                <p className="font-medium text-gray-900">{originalEvent.capacity} attendees</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <span className="text-sm text-gray-500">Ticket Tiers:</span>
              <div className="mt-2 space-y-2">
                {originalEvent.ticketTiers.map((tier) => (
                  <div key={tier.id} className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded">
                    <span className="font-medium text-gray-900">{tier.name}</span>
                    <span className="text-gray-600">${tier.price.toFixed(2)} ({tier.capacity} spots)</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <strong>Current Registrations:</strong> {originalEvent.registrationCount} of {originalEvent.capacity} spots filled
            </div>
          </div>
        </div>

        {/* Clone Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clone Settings</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 mb-1">
                New Event Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="newDate"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Event Capacity</label>
              <input
                type="number"
                id="capacity"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Original capacity: {originalEvent.capacity}</p>
            </div>
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Keep Ticket Pricing</span>
                  <p className="text-xs text-gray-500">Use same prices as original event</p>
                </div>
                <button
                  type="button"
                  onClick={() => setKeepTicketPricing(!keepTicketPricing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${keepTicketPricing ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${keepTicketPricing ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">Copy Registrations</span>
                  <p className="text-xs text-gray-500">Invite original registrants to new event</p>
                </div>
                <button
                  type="button"
                  onClick={() => setKeepRegistrations(!keepRegistrations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${keepRegistrations ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${keepRegistrations ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
            {keepRegistrations && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Note:</strong> Copying registrations will send invitations to {originalEvent.registrationCount} attendees asking them to confirm for the new date.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary & Action */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Clone Summary</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">New Date:</span>
            <span className="font-medium text-gray-900">{newStartDate || "Not selected"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">{newStartTime} - {newEndTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Capacity:</span>
            <span className="font-medium text-gray-900">{newCapacity} attendees</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium text-amber-600">Draft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Keep Pricing:</span>
            <span className="font-medium text-gray-900">{keepTicketPricing ? "Yes" : "No"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Copy Registrations:</span>
            <span className="font-medium text-gray-900">{keepRegistrations ? "Yes" : "No"}</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleClone}
            disabled={isCloning || !newStartDate}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCloning ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Cloning...
              </>
            ) : (
              "Clone as Draft"
            )}
          </button>
          <Link href={`/admin/events/${eventId}`} className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>The cloned event will be created as a draft. You can review and edit it before publishing.</p>
      </div>
    </div>
  );
}
