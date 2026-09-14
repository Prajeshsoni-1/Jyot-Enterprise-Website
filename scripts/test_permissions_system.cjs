const assert = require("assert");

console.log("==================================================");
console.log("JYOT ENTERPRISE — RBAC & PERMISSIONS TEST SUITE");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// 1. Roles & Hierarchy
const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

function isRoleAtLeast(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

function isRoleStrictlyAbove(roleA, roleB) {
  return (ROLE_HIERARCHY[roleA] || 0) > (ROLE_HIERARCHY[roleB] || 0);
}

// 2. Permission definitions
const PERMISSION_MODULES = [
  { id: "services", actions: ["view", "create", "edit", "delete", "publish"] },
  { id: "blogs", actions: ["view", "create", "edit", "delete", "publish"] },
  { id: "downloads", actions: ["view", "create", "edit", "delete", "publish"] },
  { id: "media", actions: ["view", "create", "delete", "manage"] },
  { id: "jobs", actions: ["view", "create", "edit", "delete", "publish", "manage"] },
  { id: "enquiries", actions: ["view", "create", "edit", "delete", "manage"] },
  { id: "customers", actions: ["view", "create", "edit", "delete"] },
  { id: "bookings", actions: ["view", "create", "edit", "delete", "manage"] },
  { id: "tasks", actions: ["view", "create", "edit", "delete", "manage"] },
  { id: "website", actions: ["view", "edit", "publish"] },
  { id: "seo", actions: ["view", "edit"] },
  { id: "system", actions: ["view", "create", "edit", "delete", "manage"] },
];

const ALL_PERMISSION_KEYS = PERMISSION_MODULES.flatMap((m) =>
  m.actions.map((a) => `${m.id}.${a}`),
);

const ROLE_DEFAULTS = {
  owner: [...ALL_PERMISSION_KEYS],
  admin: [
    "services.view", "services.create", "services.edit", "services.delete", "services.publish",
    "blogs.view", "blogs.create", "blogs.edit", "blogs.delete", "blogs.publish",
    "downloads.view", "downloads.create", "downloads.edit", "downloads.delete", "downloads.publish",
    "media.view", "media.create", "media.delete", "media.manage",
    "jobs.view", "jobs.create", "jobs.edit", "jobs.delete", "jobs.publish", "jobs.manage",
    "enquiries.view", "enquiries.create", "enquiries.edit", "enquiries.delete", "enquiries.manage",
    "customers.view", "customers.create", "customers.edit", "customers.delete",
    "bookings.view", "bookings.create", "bookings.edit", "bookings.delete", "bookings.manage",
    "tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.manage",
    "website.view", "website.edit", "website.publish",
    "seo.view", "seo.edit",
    "system.view", "system.create", "system.edit", "system.delete", "system.manage",
  ],
  manager: [
    "services.view", "services.create", "services.edit",
    "blogs.view", "blogs.create", "blogs.edit",
    "downloads.view", "downloads.create", "downloads.edit",
    "media.view", "media.create",
    "jobs.view", "jobs.create", "jobs.edit", "jobs.manage",
    "enquiries.view", "enquiries.create", "enquiries.edit", "enquiries.manage",
    "customers.view", "customers.create", "customers.edit",
    "bookings.view", "bookings.create", "bookings.edit", "bookings.manage",
    "tasks.view", "tasks.create", "tasks.edit", "tasks.manage",
    "website.view",
    "seo.view",
  ],
  staff: [
    "services.view",
    "blogs.view",
    "downloads.view",
    "media.view",
    "jobs.view",
    "enquiries.view", "enquiries.edit",
    "customers.view",
    "bookings.view",
    "tasks.view", "tasks.edit",
  ],
};

function calculateEffectivePermissions(role, overrides) {
  if (role === "owner") {
    return new Set(ALL_PERMISSION_KEYS);
  }
  const base = new Set(ROLE_DEFAULTS[role] || []);
  if (overrides) {
    for (const [key, granted] of Object.entries(overrides)) {
      if (granted) base.add(key);
      else base.delete(key);
    }
  }
  return base;
}

function hasPermission(effectivePermissions, module, action) {
  if (!effectivePermissions) return false;
  const key = `${module}.${action}`;
  if (effectivePermissions instanceof Set) {
    return effectivePermissions.has(key) || effectivePermissions.has(`${module}.manage`);
  }
  return effectivePermissions.includes(key) || effectivePermissions.includes(`${module}.manage`);
}

function protectOwnerSafetyLogic(caller, target, options) {
  const { newRole, newStatus, isDelete, totalOwners } = options;

  // Inactive caller check
  if (caller.status === "inactive") {
    throw new Error("Forbidden (403): Account has been deactivated.");
  }

  const isTargetOwner = target.role === "owner";

  // Last Owner Protection
  if (isTargetOwner) {
    if (isDelete && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot delete the last remaining Owner account.");
    }
    if (newRole && newRole !== "owner" && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot demote the last remaining Owner. Promote another Owner first.");
    }
    if (newStatus === "inactive" && totalOwners <= 1) {
      throw new Error("Safety Protection: Cannot deactivate the last remaining Owner account.");
    }
    if (caller.role !== "owner") {
      throw new Error("Forbidden (403): Only an Owner can modify an Owner account.");
    }
  }

  // Promotion to Owner
  if (newRole === "owner" && caller.role !== "owner") {
    throw new Error("Forbidden (403): Only an Owner can assign the Owner role.");
  }

  // Self-demotion / privilege escalation
  if (caller.userId === target.userId) {
    if (isDelete) {
      throw new Error("Safety Protection: You cannot delete your own active account.");
    }
    if (newStatus === "inactive") {
      throw new Error("Safety Protection: You cannot deactivate your own account.");
    }
    if (caller.role === "owner" && newRole && newRole !== "owner" && totalOwners <= 1) {
      throw new Error("Safety Protection: You are the last Owner and cannot demote yourself.");
    }
  }

  // Privilege escalation check: Caller cannot assign a role higher than their own
  if (newRole && !isRoleAtLeast(caller.role, newRole)) {
    throw new Error("Forbidden (403): You cannot assign a role higher than your own.");
  }

  return true;
}

function requirePermissionLogic(user, module, action) {
  if (user.status === "inactive") {
    throw new Error("Forbidden (403): Account is inactive.");
  }
  if (user.role === "owner") {
    return true; // Unconditional
  }
  if (!hasPermission(user.effectivePermissions, module, action)) {
    throw new Error(`Forbidden (403): Lacking permission ${module}.${action}.`);
  }
  return true;
}

async function main() {
  // Test 1: Owner has full access
  console.log("\n--- Requirement 1: Owner Full Access ---");
  it("Owner receives all permission keys in the system", () => {
    const ownerPerms = calculateEffectivePermissions("owner");
    assert.strictEqual(ownerPerms.size, ALL_PERMISSION_KEYS.length);
    assert.strictEqual(hasPermission(ownerPerms, "services", "delete"), true);
    assert.strictEqual(hasPermission(ownerPerms, "blogs", "publish"), true);
    assert.strictEqual(hasPermission(ownerPerms, "system", "manage"), true);
    assert.strictEqual(hasPermission(ownerPerms, "seo", "edit"), true);
  });

  // Test 2: Admin cannot modify Owner
  console.log("\n--- Requirement 2: Admin Cannot Modify Owner ---");
  it("Admin cannot demote or modify an Owner account", () => {
    const adminCaller = { userId: "admin-1", role: "admin", status: "active" };
    const ownerTarget = { userId: "owner-1", role: "owner", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(adminCaller, ownerTarget, {
          newRole: "staff",
          totalOwners: 2,
        });
      },
      /Forbidden.*Only an Owner/,
    );
  });

  it("Admin cannot deactivate an Owner account", () => {
    const adminCaller = { userId: "admin-1", role: "admin", status: "active" };
    const ownerTarget = { userId: "owner-1", role: "owner", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(adminCaller, ownerTarget, {
          newStatus: "inactive",
          totalOwners: 2,
        });
      },
      /Forbidden.*Only an Owner/,
    );
  });

  // Test 3: Manager only gets assigned permissions
  console.log("\n--- Requirement 3: Manager Role Scoping ---");
  it("Manager has lead/booking operational access but no system management", () => {
    const mgrPerms = calculateEffectivePermissions("manager");
    assert.strictEqual(hasPermission(mgrPerms, "enquiries", "view"), true);
    assert.strictEqual(hasPermission(mgrPerms, "enquiries", "edit"), true);
    assert.strictEqual(hasPermission(mgrPerms, "bookings", "edit"), true);
    assert.strictEqual(hasPermission(mgrPerms, "customers", "create"), true);
    // Should NOT have system admin actions
    assert.strictEqual(hasPermission(mgrPerms, "system", "delete"), false);
    assert.strictEqual(hasPermission(mgrPerms, "system", "manage"), false);
  });

  // Test 4: Staff cannot access unauthorized modules
  console.log("\n--- Requirement 4: Staff Restricted Access ---");
  it("Staff cannot publish or delete resources", () => {
    const staffPerms = calculateEffectivePermissions("staff");
    assert.strictEqual(hasPermission(staffPerms, "enquiries", "view"), true);
    assert.strictEqual(hasPermission(staffPerms, "tasks", "view"), true);
    assert.strictEqual(hasPermission(staffPerms, "blogs", "publish"), false);
    assert.strictEqual(hasPermission(staffPerms, "services", "delete"), false);
    assert.strictEqual(hasPermission(staffPerms, "system", "create"), false);
  });

  // Test 5: User without permission gets 403
  console.log("\n--- Requirement 5: Server-side 403 Rejection ---");
  it("requirePermission rejects unauthorized actions with 403", () => {
    const staffUser = {
      role: "staff",
      status: "active",
      effectivePermissions: calculateEffectivePermissions("staff"),
    };

    assert.throws(
      () => {
        requirePermissionLogic(staffUser, "blogs", "publish");
      },
      /Forbidden \(403\)/,
    );
  });

  it("requirePermission allows authorized actions", () => {
    const staffUser = {
      role: "staff",
      status: "active",
      effectivePermissions: calculateEffectivePermissions("staff"),
    };

    assert.doesNotThrow(() => {
      requirePermissionLogic(staffUser, "enquiries", "view");
    });
  });

  // Test 6: Permission override works
  console.log("\n--- Requirement 6: Granular Permission Overrides ---");
  it("Staff can be granted specific overrides and have default permissions revoked", () => {
    const customOverrides = {
      "blogs.create": true,
      "blogs.edit": true,
      "enquiries.edit": false, // Revoke standard staff default
    };

    const effective = calculateEffectivePermissions("staff", customOverrides);
    assert.strictEqual(hasPermission(effective, "blogs", "create"), true);
    assert.strictEqual(hasPermission(effective, "blogs", "edit"), true);
    assert.strictEqual(hasPermission(effective, "enquiries", "edit"), false);
    assert.strictEqual(hasPermission(effective, "enquiries", "view"), true); // Remains untouched
  });

  // Test 7: Last Owner cannot be deleted or deactivated
  console.log("\n--- Requirement 7: Last Owner Protection ---");
  it("Cannot delete the last Owner account even if attempted by an Owner", () => {
    const ownerCaller = { userId: "owner-1", role: "owner", status: "active" };
    const ownerTarget = { userId: "owner-1", role: "owner", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(ownerCaller, ownerTarget, {
          isDelete: true,
          totalOwners: 1,
        });
      },
      /Cannot delete the last remaining Owner/,
    );
  });

  it("Cannot deactivate the last Owner account", () => {
    const ownerCaller = { userId: "owner-1", role: "owner", status: "active" };
    const ownerTarget = { userId: "owner-1", role: "owner", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(ownerCaller, ownerTarget, {
          newStatus: "inactive",
          totalOwners: 1,
        });
      },
      /Cannot deactivate the last remaining Owner/,
    );
  });

  it("Cannot demote the last Owner account", () => {
    const ownerCaller = { userId: "owner-1", role: "owner", status: "active" };
    const ownerTarget = { userId: "owner-1", role: "owner", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(ownerCaller, ownerTarget, {
          newRole: "admin",
          totalOwners: 1,
        });
      },
      /Cannot demote the last remaining Owner/,
    );
  });

  // Test 8: Inactive user cannot access Admin
  console.log("\n--- Requirement 8: Inactive User Enforcement ---");
  it("Inactive accounts are rejected from accessing admin actions", () => {
    const deactivatedUser = {
      role: "admin",
      status: "inactive",
      effectivePermissions: calculateEffectivePermissions("admin"),
    };

    assert.throws(
      () => {
        requirePermissionLogic(deactivatedUser, "enquiries", "view");
      },
      /Forbidden \(403\): Account is inactive/,
    );
  });

  // Test 9: Privilege escalation prevention
  console.log("\n--- Requirement 9: Privilege Escalation Prevention ---");
  it("Manager or Admin cannot promote anyone to Owner", () => {
    const adminCaller = { userId: "admin-1", role: "admin", status: "active" };
    const targetUser = { userId: "staff-1", role: "staff", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(adminCaller, targetUser, {
          newRole: "owner",
          totalOwners: 1,
        });
      },
      /Forbidden.*Only an Owner can assign the Owner role/,
    );
  });

  it("Manager cannot promote anyone to Admin", () => {
    const managerCaller = { userId: "mgr-1", role: "manager", status: "active" };
    const targetUser = { userId: "staff-1", role: "staff", status: "active" };

    assert.throws(
      () => {
        protectOwnerSafetyLogic(managerCaller, targetUser, {
          newRole: "admin",
          totalOwners: 1,
        });
      },
      /cannot assign a role higher than your own/,
    );
  });

  console.log("\n==================================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
