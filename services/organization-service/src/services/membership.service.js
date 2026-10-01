import "dotenv/config";
import * as membershipRepository from "../repositories/membership.repository.js";
import { supabase } from "../lib/supabase.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

const sendInvitationEmail = async ({
    inviteEmail,
    recipientName,
    inviterName,
    orgName,
    organizationId,
    membershipId,
    isNewUser,
    tempPassword
}) => {
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
        console.warn("[Email Skipped] SMTP credentials not configured");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const apiGatewayUrl = process.env.PUBLIC_API_URL || process.env.API_GATEWAY_URL || "http://localhost:3000";
    const acceptLink = `${apiGatewayUrl}/api/v1/organizations/${organizationId}/members/${membershipId}/accept`;

    const credentialsSnippet = isNewUser ? `
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0;">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#334155; text-transform:uppercase; letter-spacing:0.5px;">Your Temporary Login Credentials</p>
            <p style="margin:4px 0; font-size:14px; color:#1e293b;"><strong>Email:</strong> ${inviteEmail}</p>
            <p style="margin:4px 0; font-size:14px; color:#1e293b;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-family:monospace; color:#0f172a; font-size:14px;">${tempPassword}</code></p>
            <p style="margin:8px 0 0 0; font-size:12px; color:#64748b;">For security, please change your password after logging in.</p>
        </div>
    ` : `
        <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:14px; margin:20px 0;">
            <p style="margin:0; font-size:14px; color:#166534;">You already have a ResQ Hub account. Accepting this invitation will instantly activate your Coordinator access for <strong>${orgName}</strong>.</p>
        </div>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `ResQ Hub <${smtpUser}>`,
        to: inviteEmail,
        subject: `Action Required: Invitation to join ${orgName} as Coordinator - ResQ Hub`,
        html: `
            <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; max-width:580px; margin:0 auto; padding:28px 24px; border:1px solid #e2e8f0; border-radius:12px; background:#ffffff;">
                <div style="text-align:center; padding-bottom:20px; border-bottom:1px solid #f1f5f9;">
                    <div style="display:inline-block; background:#0d9488; color:#ffffff; font-size:18px; font-weight:bold; border-radius:8px; width:40px; height:40px; line-height:40px; text-align:center; margin-bottom:8px;">RQ</div>
                    <h1 style="color:#0f172a; font-size:22px; margin:0; font-weight:700;">ResQ Hub</h1>
                    <p style="color:#64748b; font-size:13px; margin:4px 0 0 0;">Community Disaster & Resource Coordination Platform</p>
                </div>
                <div style="padding:24px 0;">
                    <h2 style="color:#0f172a; font-size:18px; margin:0 0 12px 0;">Hello ${recipientName},</h2>
                    <p style="color:#334155; font-size:14px; line-height:1.6; margin:0 0 14px 0;">
                        <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as an <strong>Organization Coordinator</strong>.
                    </p>
                    <p style="color:#334155; font-size:14px; line-height:1.6; margin:0 0 16px 0;">
                        As an organization coordinator, you will be able to:
                    </p>
                    <ul style="color:#334155; font-size:13px; line-height:1.8; margin:0 0 16px 20px; padding:0;">
                        <li>Review, verify, and approve citizen relief requests</li>
                        <li>Dispatch and coordinate volunteer delivery missions</li>
                        <li>Manage and allocate warehouse relief supplies and donations</li>
                        <li>Coordinate team operations across branches</li>
                    </ul>
                    ${credentialsSnippet}
                    <div style="text-align:center; margin:32px 0;">
                        <a href="${acceptLink}" style="background-color:#0d9488; color:#ffffff; padding:14px 36px; font-size:15px; font-weight:700; text-decoration:none; border-radius:8px; display:inline-block; box-shadow:0 4px 6px -1px rgba(13,148,136,0.3);">
                            Accept Invitation & Join Team
                        </a>
                    </div>
                    <p style="font-size:12px; color:#64748b; text-align:center; word-break:break-all; margin:16px 0 0 0;">
                        If the button above does not work, copy and paste this link into your browser:<br/>
                        <a href="${acceptLink}" style="color:#0d9488;">${acceptLink}</a>
                    </p>
                </div>
                <div style="border-top:1px solid #f1f5f9; padding-top:16px; text-align:center; color:#94a3b8; font-size:12px;">
                    <p style="margin:0;">ResQ Hub Platform &bull; Automated Team Invitation</p>
                </div>
            </div>
        `,
    });
    console.log(`[Email Success] Sent coordinator invitation email to ${inviteEmail} (Link: ${acceptLink})`);
};

export const createMembership = async (organizationId, membershipData, inviterId) => {
    const inviteEmail = (membershipData.email || "").trim().toLowerCase();

    // 1. Fetch organization details
    const { data: org } = await supabase
        .from("organizations")
        .select("organization_name")
        .eq("organization_id", organizationId)
        .maybeSingle();
    const orgName = org?.organization_name || "the Organization";

    // 2. Fetch inviter details
    let inviterName = "Organization Coordinator";
    if (inviterId) {
        const { data: inviterUser } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("user_id", inviterId)
            .maybeSingle();
        if (inviterUser) {
            inviterName = [inviterUser.first_name, inviterUser.last_name].filter(Boolean).join(" ") || inviterUser.email;
        }
    }

    // 3. Lookup user by email or auto-provision if not registered
    let { data: user } = await supabase
        .from("users")
        .select("user_id, email, first_name, last_name")
        .eq("email", inviteEmail)
        .maybeSingle();

    let isNewUser = false;
    let tempPassword = null;

    if (!user) {
        isNewUser = true;
        tempPassword = "ResQ@" + Math.floor(100000 + Math.random() * 900000);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
        const namePrefix = inviteEmail.split("@")[0];
        const parts = namePrefix.split(/[._-]/);
        const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const lastName = parts[1] ? (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) : "Staff";

        const { data: newUser, error: createErr } = await supabase
            .from("users")
            .insert([{
                email: inviteEmail,
                first_name: firstName,
                last_name: lastName,
                password_hash: passwordHash,
                status: "ACTIVE"
            }])
            .select()
            .single();

        if (createErr || !newUser) {
            throw new Error(createErr?.message || "Failed to create user account for invitation.");
        }
        user = newUser;

        // Default USER global role
        try {
            await supabase.from("user_roles").insert([{ user_id: user.user_id, role: "USER" }]);
        } catch (_) {}
    }

    const userId = user.user_id;

    // 4. Check if already a member
    const existing = await membershipRepository.findExistingMembership(
        organizationId,
        userId
    );

    let memberRecord;

    if (existing.data) {
        if (existing.data.status === "ACTIVE") {
            throw new Error("This user is already an active member of this organization.");
        }
        // If already pending, we reuse the existing membership and resend email
        memberRecord = existing.data;
    } else {
        // 5. Create membership in organization_members with status: 'PENDING'
        const dbData = {
            organization_id: organizationId,
            user_id: userId,
            role: "COORDINATOR",
            invited_by: inviterId || null,
            status: "PENDING"
        };

        const { data, error } = await membershipRepository.createMembership(dbData);

        if (error) {
            throw new Error(error.message);
        }
        memberRecord = data;
    }

    // 6. Send Invitation Email via Nodemailer using Gmail SMTP
    try {
        const recipientName = user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "Coordinator";
        await sendInvitationEmail({
            inviteEmail,
            recipientName,
            inviterName,
            orgName,
            organizationId,
            membershipId: memberRecord.organization_member_id,
            isNewUser,
            tempPassword
        });
    } catch (emailErr) {
        console.error(`[Email Error] Failed to send email to ${inviteEmail}:`, emailErr.message);
    }

    return memberRecord;
};

export const acceptInvitation = async (organizationId, membershipId) => {
    // 1. Fetch membership
    const { data: member, error } = await membershipRepository.getMembershipById(membershipId);

    if (error || !member) {
        throw new Error("Invalid or expired invitation link.");
    }

    if (member.organization_id !== organizationId) {
        throw new Error("Invitation does not match organization.");
    }

    // 2. Fetch organization and user details for redirect info
    const { data: org } = await supabase
        .from("organizations")
        .select("organization_name")
        .eq("organization_id", organizationId)
        .maybeSingle();

    const { data: user } = await supabase
        .from("users")
        .select("email, first_name, last_name")
        .eq("user_id", member.user_id)
        .maybeSingle();

    const orgName = org?.organization_name || "the Organization";
    const email = user?.email || "";

    if (member.status === "ACTIVE") {
        return {
            alreadyAccepted: true,
            organizationName: orgName,
            email,
            membership: member
        };
    }

    // 3. Update status to ACTIVE
    const { data: updated, error: updateErr } = await membershipRepository.updateMembership(
        membershipId,
        {
            status: "ACTIVE",
            updated_at: new Date().toISOString()
        }
    );

    if (updateErr) {
        throw new Error("Failed to activate membership: " + updateErr.message);
    }

    return {
        alreadyAccepted: false,
        organizationName: orgName,
        email,
        membership: updated
    };
};

export const resendInvitation = async (organizationId, membershipId, inviterId) => {
    // 1. Fetch membership
    const { data: member, error } = await membershipRepository.getMembershipById(membershipId);

    if (error || !member || member.organization_id !== organizationId) {
        throw new Error("Membership not found.");
    }

    if (member.status === "ACTIVE") {
        throw new Error("This member has already accepted the invitation.");
    }

    // 2. Fetch org details
    const { data: org } = await supabase
        .from("organizations")
        .select("organization_name")
        .eq("organization_id", organizationId)
        .maybeSingle();
    const orgName = org?.organization_name || "the Organization";

    // 3. Fetch inviter details
    let inviterName = "Organization Coordinator";
    if (inviterId) {
        const { data: inviterUser } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("user_id", inviterId)
            .maybeSingle();
        if (inviterUser) {
            inviterName = [inviterUser.first_name, inviterUser.last_name].filter(Boolean).join(" ") || inviterUser.email;
        }
    }

    // 4. Fetch user details
    const { data: user } = await supabase
        .from("users")
        .select("user_id, email, first_name, last_name")
        .eq("user_id", member.user_id)
        .maybeSingle();

    if (!user) {
        throw new Error("User record not found for this invitation.");
    }

    const recipientName = user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "Coordinator";

    // 5. Re-send email
    await sendInvitationEmail({
        inviteEmail: user.email,
        recipientName,
        inviterName,
        orgName,
        organizationId,
        membershipId: member.organization_member_id,
        isNewUser: false,
        tempPassword: null
    });

    return true;
};

export const getMembers = async (organizationId) => {
    const { data, error } = await membershipRepository.getMembers(organizationId);

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(m => {
        const u = m.users || {};
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        return {
            ...m,
            user_id: u.user_id || m.user_id,
            name: fullName || u.email || "Team Member",
            email: u.email || "",
            joined_at: m.created_at
        };
    });
};

export const getMembershipById = async (membershipId) => {
    const { data, error } = await membershipRepository.getMembershipById(membershipId);

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("Membership not found.");
    }

    return data;
};

export const updateMembership = async (membershipId, updateData) => {
    const existing = await membershipRepository.getMembershipById(membershipId);

    if (!existing.data) {
        throw new Error("Membership not found.");
    }

    const { data, error } = await membershipRepository.updateMembership(
        membershipId,
        updateData
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteMembership = async (membershipId) => {
    const existing = await membershipRepository.getMembershipById(membershipId);

    if (!existing.data) {
        throw new Error("Membership not found.");
    }

    const { error } = await membershipRepository.deleteMembership(membershipId);

    if (error) {
        throw new Error(error.message);
    }

    return true;
};
