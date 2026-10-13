import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  getOperationsMonitoringSnapshot,
  simulateIncidentAlert,
  resolveIncidentAlert,
  acknowledgeIncidentAlert,
  isMonitoringStaff,
  MONITORING_STAFF_ROLES,
} from '../operations/operationsMonitoringService';

describe('Phase 10: Real-Time Operations Monitoring Service', () => {
  let mockStore: Record<string, any>;
  let mockDb: any;

  beforeEach(() => {
    mockStore = {};

    const createDocRef = (path: string) => ({
      id: path.split('/').pop()!,
      path,
      get: jest.fn(async () => {
        const data = mockStore[path];
        return {
          exists: data !== undefined,
          id: path.split('/').pop()!,
          data: () => data,
        };
      }),
      set: jest.fn(async (data: any) => {
        mockStore[path] = { ...data };
      }),
      update: jest.fn(async (data: any) => {
        if (!mockStore[path]) {
          throw new Error(`Doc ${path} does not exist for update`);
        }
        mockStore[path] = { ...mockStore[path], ...data };
      }),
      collection: (subName: string) => createCollectionRef(`${path}/${subName}`),
    });

    const createQuery = (
      colPath: string,
      filters: Array<{ field: string; op: string; value: any }> = [],
      order?: { field: string; dir: string },
      limitCount?: number
    ): any => {
      return {
        where: (field: string, op: string, value: any) => {
          return createQuery(colPath, [...filters, { field, op, value }], order, limitCount);
        },
        orderBy: (field: string, dir: string = 'asc') => {
          return createQuery(colPath, filters, { field, dir }, limitCount);
        },
        limit: (n: number) => {
          return createQuery(colPath, filters, order, n);
        },
        get: async () => {
          const prefix = `${colPath}/`;
          let docs = Object.keys(mockStore)
            .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
            .map((k) => ({
              id: k.split('/').pop()!,
              data: () => mockStore[k],
            }))
            .filter((d) => {
              const docData = d.data();
              for (const f of filters) {
                const val = docData[f.field];
                if (f.op === '==') {
                  if (val !== f.value) return false;
                } else if (f.op === 'in') {
                  if (!Array.isArray(f.value) || !f.value.includes(val)) return false;
                } else if (f.op === '>=') {
                  if (val === undefined || val < f.value) return false;
                } else if (f.op === '<=') {
                  if (val === undefined || val > f.value) return false;
                }
              }
              return true;
            });

          if (order) {
            docs.sort((a, b) => {
              const vA = a.data()[order.field] || '';
              const vB = b.data()[order.field] || '';
              return order.dir === 'desc'
                ? String(vB).localeCompare(String(vA))
                : String(vA).localeCompare(String(vB));
            });
          }

          if (limitCount !== undefined && limitCount > 0) {
            docs = docs.slice(0, limitCount);
          }

          return {
            empty: docs.length === 0,
            size: docs.length,
            docs,
            forEach: (cb: (doc: any) => void) => docs.forEach(cb),
          };
        },
      };
    };

    const createCollectionRef = (colPath: string) => {
      const query = createQuery(colPath);
      return {
        ...query,
        id: colPath.split('/').pop()!,
        doc: (id?: string) => {
          const docId = id || `mock_id_${Math.random().toString(36).slice(2, 9)}`;
          return createDocRef(`${colPath}/${docId}`);
        },
      };
    };

    mockDb = {
      collection: (name: string) => createCollectionRef(name),
      doc: (path: string) => createDocRef(path),
      batch: () => {
        const operations: Array<() => Promise<void>> = [];
        return {
          set: (ref: any, data: any) => {
            operations.push(async () => {
              await ref.set(data);
            });
          },
          update: (ref: any, data: any) => {
            operations.push(async () => {
              await ref.update(data);
            });
          },
          commit: async () => {
            for (const op of operations) {
              await op();
            }
          },
        };
      },
    };
  });

  describe('RBAC & Role Verification', () => {
    it('allows valid staff roles', () => {
      for (const role of MONITORING_STAFF_ROLES) {
        expect(isMonitoringStaff(role)).toBe(true);
      }
    });

    it('rejects unauthorized roles like FAN, MUSICIAN, SPONSOR, GUEST', () => {
      expect(isMonitoringStaff('FAN')).toBe(false);
      expect(isMonitoringStaff('MUSICIAN')).toBe(false);
      expect(isMonitoringStaff('SOLO_MUSICIAN')).toBe(false);
      expect(isMonitoringStaff('BAND_MANAGER')).toBe(false);
      expect(isMonitoringStaff('SPONSOR')).toBe(false);
      expect(isMonitoringStaff('GUEST')).toBe(false);
      expect(isMonitoringStaff(undefined)).toBe(false);
    });

    it('rejects unprivileged access to getOperationsMonitoringSnapshot', async () => {
      const caller = { uid: 'fan_1', email: 'fan@example.com', role: 'FAN' };
      await expect(getOperationsMonitoringSnapshot(mockDb, caller)).rejects.toThrow(
        'Caller is not authorized to access real-time operations telemetry.'
      );
    });

    it('rejects unprivileged access to simulateIncidentAlert', async () => {
      const caller = { uid: 'fan_1', email: 'fan@example.com', role: 'FAN' };
      await expect(
        simulateIncidentAlert(
          mockDb,
          {
            category: 'DATABASE',
            severity: 'CRITICAL',
            title: 'Test',
            message: 'Unauthorized attempt',
          },
          caller
        )
      ).rejects.toThrow('Caller is not authorized to simulate operational incidents.');
    });

    it('rejects unprivileged access to resolveIncidentAlert', async () => {
      const caller = { uid: 'fan_1', email: 'fan@example.com', role: 'FAN' };
      await expect(
        resolveIncidentAlert(
          mockDb,
          {
            alertId: 'alert_1',
            resolutionReason: 'Resolved by fan',
          },
          caller
        )
      ).rejects.toThrow('Caller is not authorized to resolve operational incidents.');
    });

    it('rejects unprivileged access to acknowledgeIncidentAlert', async () => {
      const caller = { uid: 'fan_1', email: 'fan@example.com', role: 'FAN' };
      await expect(
        acknowledgeIncidentAlert(
          mockDb,
          {
            alertId: 'alert_1',
          },
          caller
        )
      ).rejects.toThrow('Caller is not authorized to acknowledge operational incidents.');
    });
  });

  describe('getOperationsMonitoringSnapshot', () => {
    it('aggregates live sessions, check-ins, webhooks, compute/auth, moderation, and support backlog', async () => {
      const now = new Date();
      const recentIso = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

      // Seed live sessions
      mockStore['liveSessions/session_1'] = {
        id: 'session_1',
        status: 'active',
        audienceCount: 15,
        venueId: 'venue_austin_1',
      };
      mockStore['liveSessions/session_2'] = {
        id: 'session_2',
        status: 'active',
        nearbyFansCount: 25,
        venueId: 'venue_austin_2',
      };

      // Seed check-in attempts (last hour)
      mockStore['checkInAttempts/checkin_1'] = {
        createdAt: recentIso,
        verified: true,
        riskScore: 10,
      };
      mockStore['checkInAttempts/checkin_2'] = {
        createdAt: recentIso,
        verified: false,
        anomaly: true,
        riskScore: 85,
      };

      // Seed stripe webhooks
      mockStore['stripeWebhookEvents/wh_1'] = {
        receivedAt: recentIso,
        status: 'PROCESSED',
        processingTimeMs: 80,
      };
      mockStore['stripeWebhookEvents/wh_2'] = {
        receivedAt: recentIso,
        status: 'FAILED',
        statusCode: 500,
        processingTimeMs: 140,
      };

      // Seed payout holds
      mockStore['payoutHolds/hold_1'] = {
        status: 'ACTIVE',
        musicianId: 'artist_99',
      };

      // Seed auth error
      mockStore['authEvents/auth_1'] = {
        createdAt: recentIso,
        success: false,
      };

      // Seed reports
      mockStore['reports/rep_1'] = {
        status: 'RECEIVED',
        slaTier: 'CRITICAL_1_HOUR',
      };

      // Seed moderation appeals and creator strikes
      mockStore['moderationAppeals/app_1'] = {
        status: 'PENDING',
      };
      mockStore['creatorStrikes/strike_1'] = {
        status: 'ACTIVE',
      };

      // Seed support tickets
      mockStore['supportRequests/ticket_1'] = {
        status: 'open',
        priority: 'urgent',
        assignedTo: null,
        slaDueAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // overdue
      };

      // Seed active alerts
      mockStore['systemAlerts/alert_live_1'] = {
        category: 'WEBHOOK',
        severity: 'MEDIUM',
        title: 'Webhook processing spike',
        status: 'ACTIVE',
        isSimulated: false,
        createdAt: recentIso,
      };

      const caller = { uid: 'admin_1', email: 'admin@crowdbeats.com', role: 'SUPER_ADMIN' };
      const snapshot = await getOperationsMonitoringSnapshot(mockDb, caller);

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.metricFreshnessSeconds).toBe(1);

      // Verify Live Performance Health
      expect(snapshot.livePerformance.activeLiveSessionsCount).toBe(2);
      expect(snapshot.livePerformance.activeVenuesCount).toBe(2);
      expect(snapshot.livePerformance.activeAudienceNearbyCount).toBe(40);
      expect(snapshot.livePerformance.checkInAttemptsLastHour).toBe(2);
      expect(snapshot.livePerformance.checkInSuccessRatePct).toBe(50.0);
      expect(snapshot.livePerformance.flaggedLocationAnomaliesCount).toBe(1);

      // Verify Payment & Webhook Health
      expect(snapshot.paymentWebhook.webhooksReceivedLastHour).toBe(2);
      expect(snapshot.paymentWebhook.failedWebhooksCount).toBe(1);
      expect(snapshot.paymentWebhook.webhookSuccessRatePct).toBe(50.0);
      expect(snapshot.paymentWebhook.averageProcessingLatencyMs).toBe(110);
      expect(snapshot.paymentWebhook.activePayoutHoldsCount).toBe(1);

      // Verify Compute & Auth Health
      expect(snapshot.computeAndAuth.authErrorsLastHour).toBe(1);
      expect(snapshot.computeAndAuth.cloudFunctionsStatus).toBe('HEALTHY');

      // Verify Moderation Queue
      expect(snapshot.moderationQueue.pendingAbuseReportsCount).toBe(1);
      expect(snapshot.moderationQueue.criticalSlaReportsCount).toBe(1);
      expect(snapshot.moderationQueue.pendingAppealsCount).toBe(1);
      expect(snapshot.moderationQueue.activeCreatorStrikesCount).toBe(1);

      // Verify Support Backlog
      expect(snapshot.supportBacklog.openTicketsCount).toBe(1);
      expect(snapshot.supportBacklog.unassignedTicketsCount).toBe(1);
      expect(snapshot.supportBacklog.urgentP1TicketsCount).toBe(1);
      expect(snapshot.supportBacklog.overdueSlaTicketsCount).toBe(1);

      // Verify Alerts
      expect(snapshot.activeAlerts.length).toBe(1);
      expect(snapshot.activeAlerts[0].title).toBe('Webhook processing spike');

      // Verify Telemetry Cost Evaluation
      expect(snapshot.costEvaluation.estimatedReadsPerScan).toBe(35);
      expect(snapshot.costEvaluation.listenersAvoidedCount).toBe(12);
      expect(snapshot.costEvaluation.costSavingsMultiplier).toContain('18.5x');
    });

    it('synthesizes overallSystemHealth as OUTAGE when CRITICAL alert is ACTIVE', async () => {
      const nowIso = new Date().toISOString();
      mockStore['systemAlerts/crit_1'] = {
        category: 'DATABASE',
        severity: 'CRITICAL',
        title: 'Database connection exhausted',
        status: 'ACTIVE',
        createdAt: nowIso,
      };

      const caller = { uid: 'admin_1', email: 'admin@crowdbeats.com', role: 'DEVELOPER' };
      const snapshot = await getOperationsMonitoringSnapshot(mockDb, caller);
      expect(snapshot.overallSystemHealth).toBe('OUTAGE');
    });

    it('synthesizes overallSystemHealth as DEGRADED when HIGH alert is ACTIVE', async () => {
      const nowIso = new Date().toISOString();
      mockStore['systemAlerts/high_1'] = {
        category: 'STRIPE_API',
        severity: 'HIGH',
        title: 'Stripe rate limit approaching',
        status: 'ACTIVE',
        createdAt: nowIso,
      };

      const caller = { uid: 'admin_1', email: 'admin@crowdbeats.com', role: 'DEVELOPER' };
      const snapshot = await getOperationsMonitoringSnapshot(mockDb, caller);
      expect(snapshot.overallSystemHealth).toBe('DEGRADED');
    });
  });

  describe('simulateIncidentAlert', () => {
    const caller = { uid: 'staff_1', email: 'ops@crowdbeats.com', role: 'SUPER_ADMIN' };

    it('rejects missing or empty title/message', async () => {
      await expect(
        simulateIncidentAlert(
          mockDb,
          {
            category: 'PAYMENT_WEBHOOK',
            severity: 'HIGH',
            title: '',
            message: 'Some detail',
          },
          caller
        )
      ).rejects.toThrow('Category, severity, title, and message are required.');
    });

    it('successfully creates simulated incident alert, audit event, and crmEvent', async () => {
      const res = await simulateIncidentAlert(
        mockDb,
        {
          category: 'PAYMENT_WEBHOOK',
          severity: 'HIGH',
          title: 'Elevated decline rates on Chase cards',
          message: 'Simulating high decline scenario for operational drill.',
          metadata: { drillId: 'DRILL-2026-10-A' },
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.alert.isSimulated).toBe(true);
      expect(res.alert.title).toContain('[SIMULATED] Elevated decline rates on Chase cards');
      expect(res.alert.status).toBe('ACTIVE');

      // Check stored alert
      const storedAlert = mockStore[`systemAlerts/${res.alert.alertId}`];
      expect(storedAlert).toBeDefined();
      expect(storedAlert.category).toBe('PAYMENT_WEBHOOK');
      expect(storedAlert.severity).toBe('HIGH');
      expect(storedAlert.metadata.drillId).toBe('DRILL-2026-10-A');
      expect(storedAlert.metadata.simulatedByEmail).toBe('ops@crowdbeats.com');

      // Check audit event
      const auditKeys = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditKeys.length).toBe(1);
      const audit = mockStore[auditKeys[0]];
      expect(audit.action).toBe('SIMULATE_INCIDENT_ALERT');
      expect(audit.targetUid).toBe(res.alert.alertId);

      // Check CRM event
      const crmKeys = Object.keys(mockStore).filter((k) => k.startsWith('crmEvents/'));
      expect(crmKeys.length).toBe(1);
      const crm = mockStore[crmKeys[0]];
      expect(crm.eventType).toBe('OPERATIONAL_ALERT_TRIGGERED');
      expect(crm.targetId).toBe(res.alert.alertId);
      expect(crm.payload.isSimulated).toBe(true);
    });
  });

  describe('acknowledgeIncidentAlert', () => {
    const caller = { uid: 'staff_1', email: 'ops@crowdbeats.com', role: 'CUSTOMER_SUPPORT' };

    it('rejects if alert does not exist', async () => {
      await expect(
        acknowledgeIncidentAlert(mockDb, { alertId: 'nonexistent_alert' }, caller)
      ).rejects.toThrow('Alert nonexistent_alert not found.');
    });

    it('successfully acknowledges active alert and records audit log', async () => {
      mockStore['systemAlerts/alert_test_1'] = {
        alertId: 'alert_test_1',
        title: 'High latency',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const res = await acknowledgeIncidentAlert(mockDb, { alertId: 'alert_test_1' }, caller);
      expect(res.ok).toBe(true);
      expect(res.status).toBe('ACKNOWLEDGED');

      const updated = mockStore['systemAlerts/alert_test_1'];
      expect(updated.status).toBe('ACKNOWLEDGED');
      expect(updated.acknowledgedBy).toBe('ops@crowdbeats.com');
      expect(updated.acknowledgedAt).toBeDefined();

      // Check audit log
      const auditKeys = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditKeys.length).toBe(1);
      expect(mockStore[auditKeys[0]].action).toBe('ACKNOWLEDGE_INCIDENT_ALERT');
    });
  });

  describe('resolveIncidentAlert', () => {
    const caller = { uid: 'staff_1', email: 'ops@crowdbeats.com', role: 'SUPER_ADMIN' };

    it('rejects if resolution reason is missing or shorter than 5 chars', async () => {
      await expect(
        resolveIncidentAlert(mockDb, { alertId: 'alert_1', resolutionReason: 'ok' }, caller)
      ).rejects.toThrow('Detailed resolution reason is mandatory (minimum 5 characters).');
    });

    it('rejects if alert does not exist', async () => {
      await expect(
        resolveIncidentAlert(
          mockDb,
          { alertId: 'missing_alert', resolutionReason: 'Resolved by scaling pods' },
          caller
        )
      ).rejects.toThrow('Alert missing_alert not found.');
    });

    it('successfully resolves alert with valid reason and records audit log', async () => {
      mockStore['systemAlerts/alert_test_2'] = {
        alertId: 'alert_test_2',
        title: 'CPU spike',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const res = await resolveIncidentAlert(
        mockDb,
        {
          alertId: 'alert_test_2',
          resolutionReason: 'Scaled up container instances to handle peak check-in load.',
        },
        caller
      );

      expect(res.ok).toBe(true);
      expect(res.status).toBe('RESOLVED');

      const updated = mockStore['systemAlerts/alert_test_2'];
      expect(updated.status).toBe('RESOLVED');
      expect(updated.resolutionReason).toContain('Scaled up container instances');
      expect(updated.resolvedBy).toBe('ops@crowdbeats.com');
      expect(updated.resolvedAt).toBeDefined();

      // Check audit log
      const auditKeys = Object.keys(mockStore).filter((k) => k.startsWith('auditEvents/'));
      expect(auditKeys.length).toBe(1);
      expect(mockStore[auditKeys[0]].action).toBe('RESOLVE_INCIDENT_ALERT');
      expect(mockStore[auditKeys[0]].reason).toContain('Scaled up container instances');
    });
  });
});
