import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shift_id } = await req.json();

    if (!shift_id) {
      return Response.json({ error: 'Missing shift_id' }, { status: 400 });
    }

    const issues = { blockers: [], warnings: [] };

    // Check required tasks are completed
    const requiredTasks = await base44.asServiceRole.entities.Task.filter({
      shift_id,
      is_required_for_close: true,
    });

    const incompleteTasks = requiredTasks.filter(t => t.status !== 'completed' && t.status !== 'approved');
    if (incompleteTasks.length > 0) {
      issues.blockers.push({
        type: 'incomplete_required_tasks',
        count: incompleteTasks.length,
        message: `${incompleteTasks.length} required task(s) not completed`,
      });
    }

    // Check critical issues
    const criticalIssues = await base44.asServiceRole.entities.Issue.filter({
      shift_id,
      status: { $ne: 'resolved' },
      priority: 'critical',
    });

    if (criticalIssues.length > 0) {
      issues.blockers.push({
        type: 'critical_issues',
        count: criticalIssues.length,
        message: `${criticalIssues.length} critical issue(s) remain open`,
      });
    }

    // Check for blocking issues
    const blockingIssues = await base44.asServiceRole.entities.Issue.filter({
      shift_id,
      blocks_shift_close: true,
      status: { $ne: 'resolved' },
    });

    if (blockingIssues.length > 0) {
      issues.blockers.push({
        type: 'blocking_issues',
        count: blockingIssues.length,
        message: `${blockingIssues.length} issue(s) block shift close`,
      });
    }

    // Warnings (not blockers)
    const openIssues = await base44.asServiceRole.entities.Issue.filter({
      shift_id,
      status: { $ne: 'resolved' },
    });

    if (openIssues.length > 3) {
      issues.warnings.push({
        type: 'many_open_issues',
        count: openIssues.length,
        message: `${openIssues.length} issue(s) still open for next shift`,
      });
    }

    const canClose = issues.blockers.length === 0;
    return Response.json({ canClose, issues });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});