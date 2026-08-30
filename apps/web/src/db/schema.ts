import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['patient', 'staff', 'dentist']);
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'booked',
  'cancelled',
  'completed',
  'no_show',
]);
export const aiRoleEnum = pgEnum('ai_role', ['user', 'assistant']);

const id = () => uuid('id').defaultRandom().primaryKey();
const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();

/** Mirrored from Clerk. Clerk owns identity; this row owns the FK target. */
export const users = pgTable('users', {
  id: id(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email'),
  role: roleEnum('role').notNull().default('patient'),
  createdAt: createdAt(),
});

/**
 * Family model: one account has N patients, exactly one with is_self.
 * Appointments point here, never at users.
 */
export const patients = pgTable(
  'patients',
  {
    id: id(),
    accountUserId: uuid('account_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    isSelf: boolean('is_self').notNull().default(false),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    dateOfBirth: date('date_of_birth'),
    phone: text('phone'),
    gender: text('gender'),
    primaryConcern: text('primary_concern'),
    referralSource: text('referral_source'),
    lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('patients_account_idx').on(t.accountUserId),
    // "Exactly one is_self per account" — the half a unique index can express.
    uniqueIndex('patients_one_self_per_account')
      .on(t.accountUserId)
      .where(sql`"is_self" = true`),
  ]
);

/** THE PHI TABLE. Every staff read/write hits audit_log. */
export const medicalHistories = pgTable('medical_histories', {
  id: id(),
  patientId: uuid('patient_id')
    .notNull()
    .unique()
    .references(() => patients.id, { onDelete: 'cascade' }),
  allergies: text('allergies').array().notNull().default([]),
  medications: text('medications').array().notNull().default([]),
  conditions: text('conditions').array().notNull().default([]),
  isSmoker: boolean('is_smoker').notNull().default(false),
  isPregnant: boolean('is_pregnant').notNull().default(false),
  anxietyLevel: smallint('anxiety_level'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dentists = pgTable('dentists', {
  id: id(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  title: text('title'),
  specialty: text('specialty'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  isActive: boolean('is_active').notNull().default(true),
});

export const services = pgTable('services', {
  id: id(),
  /** Stable key the mobile UI already uses: checkup, cleaning, pain, white, ortho, resto. */
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  isTeleconsult: boolean('is_teleconsult').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
});

export const dentistServices = pgTable(
  'dentist_services',
  {
    dentistId: uuid('dentist_id')
      .notNull()
      .references(() => dentists.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.dentistId, t.serviceId] })]
);

/** Clinic-local wall-clock times. Expanded to instants through CLINIC_TZ. */
export const workingHours = pgTable(
  'working_hours',
  {
    id: id(),
    dentistId: uuid('dentist_id')
      .notNull()
      .references(() => dentists.id, { onDelete: 'cascade' }),
    weekday: smallint('weekday').notNull(), // 0 = Sunday .. 6 = Saturday
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
  },
  (t) => [index('working_hours_dentist_idx').on(t.dentistId, t.weekday)]
);

export const timeOff = pgTable(
  'time_off',
  {
    id: id(),
    dentistId: uuid('dentist_id')
      .notNull()
      .references(() => dentists.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    reason: text('reason'),
  },
  (t) => [index('time_off_dentist_idx').on(t.dentistId, t.startsAt)]
);

/**
 * Double-booking is prevented by an EXCLUDE USING gist constraint added in a
 * hand-written migration — Drizzle can't generate it. Never replace it with an
 * application-level check.
 */
export const appointments = pgTable(
  'appointments',
  {
    id: id(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    dentistId: uuid('dentist_id')
      .notNull()
      .references(() => dentists.id, { onDelete: 'restrict' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: appointmentStatusEnum('status').notNull().default('booked'),
    streamCallId: text('stream_call_id'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'set null' }),
    reminder24hSentAt: timestamp('reminder_24h_sent_at', { withTimezone: true }),
    reminder1hSentAt: timestamp('reminder_1h_sent_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('appointments_dentist_starts_idx').on(t.dentistId, t.startsAt),
    index('appointments_patient_starts_idx').on(t.patientId, t.startsAt),
  ]
);

/** Post-op instructions. Patient-readable. */
export const visitNotes = pgTable('visit_notes', {
  id: id(),
  appointmentId: uuid('appointment_id')
    .notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

export const aiConversations = pgTable('ai_conversations', {
  id: id(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
});

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: id(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: aiRoleEnum('role').notNull(),
    content: text('content').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('ai_messages_conversation_idx').on(t.conversationId, t.createdAt)]
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('audit_log_entity_idx').on(t.entity, t.entityId)]
);

// ---- relations (used by the dashboard's Server Components) ----

export const usersRelations = relations(users, ({ many }) => ({
  patients: many(patients),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  account: one(users, { fields: [patients.accountUserId], references: [users.id] }),
  medicalHistory: one(medicalHistories, {
    fields: [patients.id],
    references: [medicalHistories.patientId],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  dentist: one(dentists, { fields: [appointments.dentistId], references: [dentists.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  notes: many(visitNotes),
}));

export const visitNotesRelations = relations(visitNotes, ({ one }) => ({
  appointment: one(appointments, {
    fields: [visitNotes.appointmentId],
    references: [appointments.id],
  }),
}));

export const dentistsRelations = relations(dentists, ({ many }) => ({
  workingHours: many(workingHours),
  timeOff: many(timeOff),
  dentistServices: many(dentistServices),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  dentistServices: many(dentistServices),
}));

export const dentistServicesRelations = relations(dentistServices, ({ one }) => ({
  dentist: one(dentists, { fields: [dentistServices.dentistId], references: [dentists.id] }),
  service: one(services, { fields: [dentistServices.serviceId], references: [services.id] }),
}));

export const aiConversationsRelations = relations(aiConversations, ({ many }) => ({
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));
