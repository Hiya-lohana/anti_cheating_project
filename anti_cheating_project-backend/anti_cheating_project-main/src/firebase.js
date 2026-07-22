import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Generate a random 6-character uppercase join code for tests
 */
export function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a random 8-character invite code for organizations
 */
export function generateOrgInviteCode(orgName) {
  const cleanName = orgName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4) || 'ORG';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}-${num}`;
}

/**
 * Fetch all registered organizations
 */
export async function fetchOrganizations() {
  try {
    const snap = await getDocs(collection(db, 'organizations'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching organizations:', err);
    return [];
  }
}

/**
 * Sign up user with email/password and create user profile in Firestore
 */
export async function signUpUser({ email, password, name, role, organizationName, organizationId }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  let orgId = organizationId || '';
  let finalOrgName = organizationName || '';

  if (role === 'instructor') {
    // Create new organization or link existing
    if (organizationName) {
      const orgInviteCode = generateOrgInviteCode(organizationName);
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: organizationName,
        inviteCode: orgInviteCode,
        createdBy: uid,
        createdAt: serverTimestamp()
      });
      orgId = orgRef.id;
      finalOrgName = organizationName;
    }
  } else if (role === 'student') {
    // If student selected or typed an organization
    if (!orgId && organizationName) {
      const orgsQuery = query(collection(db, 'organizations'), where('name', '==', organizationName.trim()));
      const orgSnap = await getDocs(orgsQuery);
      if (!orgSnap.empty) {
        orgId = orgSnap.docs[0].id;
        finalOrgName = orgSnap.docs[0].data().name;
      }
    }

    if (!orgId) {
      const orgsSnap = await getDocs(collection(db, 'organizations'));
      if (!orgsSnap.empty) {
        orgId = orgsSnap.docs[0].id;
        finalOrgName = orgsSnap.docs[0].data().name;
      } else {
        orgId = 'default_org';
        finalOrgName = 'Global Organization';
      }
    }
  }

  const userProfile = {
    uid,
    name,
    email,
    role,
    organizationId: orgId,
    organizationName: finalOrgName,
    createdAt: new Date().toISOString()
  };

  // Store in role-specific collection as well as users collection
  const collectionName = role === 'instructor' ? 'teachers' : 'students';
  await setDoc(doc(db, collectionName, uid), userProfile);
  await setDoc(doc(db, 'users', uid), userProfile);

  return userProfile;
}

/**
 * Log in user and fetch profile (with automatic profile healing if missing)
 */
export async function loginUser(email, password, fallbackRole = 'student') {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  let userProfile = await getUserProfile(user.uid);

  // Self-healing: if Firestore profile document is missing, create it automatically
  if (!userProfile) {
    userProfile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      role: fallbackRole,
      organizationId: 'default_org',
      organizationName: 'Global Organization',
      createdAt: new Date().toISOString()
    };
    try {
      const collectionName = fallbackRole === 'instructor' ? 'teachers' : 'students';
      await setDoc(doc(db, collectionName, user.uid), userProfile);
      await setDoc(doc(db, 'users', user.uid), userProfile);
    } catch (e) {
      console.warn('Could not heal Firestore profile:', e);
    }
  }

  return { user, profile: userProfile };
}

/**
 * Fetch user profile from Firestore with fallback checks
 */
export async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    
    // Fallback check in teachers/students
    const teacherDoc = await getDoc(doc(db, 'teachers', uid));
    if (teacherDoc.exists()) return teacherDoc.data();
    
    const studentDoc = await getDoc(doc(db, 'students', uid));
    if (studentDoc.exists()) return studentDoc.data();
  } catch (err) {
    console.error('Error in getUserProfile:', err);
  }

  // Fallback profile if Firestore read fails or doc is missing
  if (auth.currentUser && auth.currentUser.uid === uid) {
    return {
      uid: auth.currentUser.uid,
      name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
      email: auth.currentUser.email,
      role: 'student',
      organizationId: 'default_org',
      organizationName: 'Global Organization',
      createdAt: new Date().toISOString()
    };
  }

  return null;
}

/**
 * Create a new exam test (Instructor only)
 */
export async function createTest({ title, description, durationMinutes, organizationId, createdBy, creatorName }) {
  const joinCode = generateJoinCode();
  const testData = {
    title,
    description: description || '',
    durationMinutes: Number(durationMinutes) || 60,
    organizationId,
    createdBy,
    creatorName: creatorName || 'Instructor',
    joinCode,
    isLocked: false,
    enrolledStudents: [], // array of { studentId, name, email, joinedAt }
    status: 'Scheduled',
    createdAt: new Date().toISOString()
  };

  const testRef = await addDoc(collection(db, 'tests'), testData);
  return { id: testRef.id, ...testData };
}

/**
 * Join test using Join Code (Student flow)
 */
export async function joinTestByCode({ joinCode, studentUser }) {
  const code = joinCode.trim().toUpperCase();
  const q = query(
    collection(db, 'tests'), 
    where('joinCode', '==', code)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error('Invalid Join Code. Please check the code and try again.');
  }

  const testDoc = snap.docs[0];
  const testData = testDoc.data();

  // Validate organization matching
  if (testData.organizationId !== studentUser.organizationId) {
    throw new Error('This test belongs to a different organization. Access denied.');
  }

  // Check lock status
  if (testData.isLocked) {
    throw new Error('This test is currently locked by the instructor.');
  }

  // Check if student is already enrolled
  const existingEnrolled = testData.enrolledStudents || [];
  const isAlreadyEnrolled = existingEnrolled.some(s => s.studentId === studentUser.uid);

  if (!isAlreadyEnrolled) {
    const studentEntry = {
      studentId: studentUser.uid,
      name: studentUser.name,
      email: studentUser.email,
      joinedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'tests', testDoc.id), {
      enrolledStudents: arrayUnion(studentEntry)
    });
  }

  return { id: testDoc.id, ...testData };
}

/**
 * Fetch organization tests for student/instructor with real-time student submission merging
 */
export async function fetchOrganizationTests(organizationId) {
  if (!organizationId) return [];
  const q = query(
    collection(db, 'tests'),
    where('organizationId', '==', organizationId)
  );
  const snap = await getDocs(q);

  const tests = await Promise.all(snap.docs.map(async (docSnap) => {
    const testData = { id: docSnap.id, ...docSnap.data() };
    
    // Fetch testResults to ensure all submitted students are included in roster & count
    try {
      const resultsQ = query(collection(db, 'testResults'), where('testId', '==', docSnap.id));
      const resultsSnap = await getDocs(resultsQ);
      const submittedStudents = resultsSnap.docs.map(d => {
        const data = d.data();
        return { studentId: data.studentId, name: data.studentName || 'Student', email: data.studentEmail || '', score: data.percentage, submittedAt: data.submittedAt };
      });

      const enrolledMap = new Map();
      (testData.enrolledStudents || []).forEach(s => enrolledMap.set(s.studentId, s));
      (testData.completedStudents || []).forEach(s => enrolledMap.set(s.studentId, { ...enrolledMap.get(s.studentId), ...s }));
      submittedStudents.forEach(s => enrolledMap.set(s.studentId, { ...enrolledMap.get(s.studentId), ...s }));

      testData.enrolledStudents = Array.from(enrolledMap.values());
      testData.completedStudents = submittedStudents;
    } catch (e) {
      console.warn('Could not fetch results for test:', docSnap.id, e);
    }

    return testData;
  }));

  return tests;
}

/**
 * Lock/Unlock a test
 */
export async function toggleTestLock(testId, isLocked) {
  await updateDoc(doc(db, 'tests', testId), { isLocked });
}

/**
 * Update an existing test
 */
export async function updateTest(testId, updatedData) {
  await updateDoc(doc(db, 'tests', testId), {
    ...updatedData,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a test
 */
export async function deleteTest(testId) {
  await deleteDoc(doc(db, 'tests', testId));
}

/**
 * Remove student from enrolled list of a test
 */
export async function removeStudentFromTest(testId, studentId) {
  const testDoc = await getDoc(doc(db, 'tests', testId));
  if (!testDoc.exists()) return;

  const currentEnrolled = testDoc.data().enrolledStudents || [];
  const updatedEnrolled = currentEnrolled.filter(s => s.studentId !== studentId);

  await updateDoc(doc(db, 'tests', testId), {
    enrolledStudents: updatedEnrolled
  });
}

/**
 * Submit exam result and mark test as completed for student
 */
export async function submitTestResult({ testId, studentId, studentName, studentEmail, score, totalQuestions, tabSwitches, violations }) {
  const submissionData = {
    testId,
    studentId,
    studentName,
    studentEmail,
    score: Number(score) || 0,
    totalQuestions: Number(totalQuestions) || 0,
    percentage: Math.round(((Number(score) || 0) / (Number(totalQuestions) || 1)) * 100),
    tabSwitches: Number(tabSwitches) || 0,
    violations: violations || [],
    submittedAt: new Date().toISOString()
  };

  // 1. Save in testResults collection
  await addDoc(collection(db, 'testResults'), submissionData);

  // 2. Record completion & enrollment on test document
  const completedStudentEntry = {
    studentId,
    name: studentName,
    email: studentEmail,
    score: submissionData.percentage,
    submittedAt: submissionData.submittedAt
  };

  const enrolledStudentEntry = {
    studentId,
    name: studentName,
    email: studentEmail,
    joinedAt: new Date().toISOString()
  };

  try {
    await updateDoc(doc(db, 'tests', testId), {
      completedStudents: arrayUnion(completedStudentEntry),
      enrolledStudents: arrayUnion(enrolledStudentEntry)
    });
  } catch (e) {
    console.warn('Could not update completedStudents on test doc:', e);
  }

  return submissionData;
}

/**
 * Fetch submitted test results for a student
 */
export async function fetchStudentTestResults(studentId) {
  if (!studentId) return [];
  try {
    const q = query(
      collection(db, 'testResults'),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error fetching student test results:', e);
    return [];
  }
}

/**
 * Fetch all submitted test results for a test
 */
export async function fetchTestResultsByTestId(testId) {
  if (!testId) return [];
  try {
    const q = query(
      collection(db, 'testResults'),
      where('testId', '==', testId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error fetching test results by testId:', e);
    return [];
  }
}

/**
 * Save live proctoring telemetry (tab switches, anomalies) for instructor live view
 */
export async function saveLiveTelemetry({ testId, studentId, studentName, studentEmail, tabSwitches, faceWarnings, violations }) {
  if (!testId || !studentId) return;
  const telemetryDocId = `${testId}_${studentId}`;
  const telemetryData = {
    testId,
    studentId,
    name: studentName,
    email: studentEmail,
    tabSwitches: Number(tabSwitches) || 0,
    faceWarnings: Number(faceWarnings) || 0,
    violations: violations || [],
    lastActive: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'liveTelemetry', telemetryDocId), telemetryData, { merge: true });
  } catch (e) {
    console.warn('Could not save live telemetry:', e);
  }
}

/**
 * Fetch live proctoring telemetry for all students taking a test
 */
export async function fetchLiveTelemetry(testId) {
  if (!testId) return [];
  try {
    const q = query(
      collection(db, 'liveTelemetry'),
      where('testId', '==', testId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('Error fetching live telemetry:', e);
    return [];
  }
}

/**
 * Sign out user
 */
export async function logoutUser() {
  await signOut(auth);
}
