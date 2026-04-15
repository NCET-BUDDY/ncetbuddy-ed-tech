"use client";

import { useEffect, useState } from "react";
import { getAdminStudentPerformance, StudentPerformanceData } from "@/lib/pocketbase-db";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, ChevronDown, ChevronUp, AlertTriangle, Trophy, Target, Clock, BookOpen, TrendingDown, Award, Users, BarChart3 } from "lucide-react";

function formatTime(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatDate(timestamp: number): string {
    if (!timestamp) return '—';
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentPerformancePage() {
    const [data, setData] = useState<StudentPerformanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'tests' | 'score' | 'accuracy'>('tests');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getAdminStudentPerformance();
                setData(result);
            } catch (error) {
                console.error("Error fetching student performance:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredData = data.filter(student =>
        student.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedData = [...filteredData].sort((a, b) => {
        if (sortBy === 'tests') return b.testsAttempted - a.testsAttempted;
        if (sortBy === 'score') return b.overallScore - a.overallScore;
        return b.averageAccuracy - a.averageAccuracy;
    });

    const totalStudentsWithTests = data.length;
    const avgAccuracyAll = data.length > 0
        ? Math.round(data.reduce((sum, s) => sum + s.averageAccuracy, 0) / data.length)
        : 0;
    const totalTestsTaken = data.reduce((sum, s) => sum + s.testsAttempted, 0);
    const studentsWithWeakSections = data.filter(s => s.weakSections.length > 0).length;

    if (loading) {
        return (
            <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                minHeight: "80vh", flexDirection: "column", gap: "1rem"
            }}>
                <div style={{
                    width: "48px", height: "48px", border: "4px solid rgba(255,208,47,0.3)",
                    borderTopColor: "var(--primary)", borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading student performance data...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{
                    fontSize: "1.8rem", fontWeight: 900, textTransform: "uppercase",
                    fontStyle: "italic", letterSpacing: "-0.5px", marginBottom: "0.5rem"
                }}>
                    Student Performance
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    One-to-one mentorship dashboard • Har student ka detailed performance view
                </p>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <StatCard icon={<Users size={20} />} label="Active Students" value={String(totalStudentsWithTests)} color="#3B82F6" />
                <StatCard icon={<BookOpen size={20} />} label="Total Tests Taken" value={String(totalTestsTaken)} color="#10B981" />
                <StatCard icon={<Target size={20} />} label="Avg Accuracy" value={`${avgAccuracyAll}%`} color="#F59E0B" />
                <StatCard icon={<AlertTriangle size={20} />} label="Need Mentorship" value={String(studentsWithWeakSections)} color="#EF4444" />
            </div>

            {/* Search & Sort */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: "36px" }}
                    />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {(['tests', 'score', 'accuracy'] as const).map(option => (
                        <button
                            key={option}
                            onClick={() => setSortBy(option)}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "8px",
                                border: sortBy === option ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.15)",
                                background: sortBy === option ? "var(--primary)" : "var(--surface)",
                                color: sortBy === option ? "black" : "var(--text-secondary)",
                                fontWeight: sortBy === option ? 700 : 400,
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                textTransform: "capitalize",
                                transition: "all 0.2s",
                            }}
                        >
                            {option === 'tests' ? 'Tests' : option === 'score' ? 'Score' : 'Accuracy'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sortedData.map((student) => (
                    <StudentCard
                        key={student.userId}
                        student={student}
                        isExpanded={expandedUser === student.userId}
                        onToggle={() => setExpandedUser(expandedUser === student.userId ? null : student.userId)}
                    />
                ))}

                {sortedData.length === 0 && (
                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                        {searchTerm ? "No students found matching your search." : "No student test data available yet."}
                    </div>
                )}
            </div>
        </div>
    );
}

function StudentCard({
    student,
    isExpanded,
    onToggle
}: {
    student: StudentPerformanceData;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const accuracyColor = student.averageAccuracy >= 70 ? '#10B981' : student.averageAccuracy >= 40 ? '#F59E0B' : '#EF4444';
    const hasWeakSections = student.weakSections.length > 0;

    return (
        <Card style={{
            overflow: "hidden",
            border: hasWeakSections ? "1px solid rgba(239, 68, 68, 0.3)" : undefined,
            transition: "all 0.3s ease",
        }}>
            {/* Clickable Header */}
            <div
                onClick={onToggle}
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    transition: "background 0.2s",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                    {/* Avatar */}
                    <div style={{
                        width: "42px", height: "42px", borderRadius: "50%",
                        background: `linear-gradient(135deg, ${accuracyColor}20, ${accuracyColor}40)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: "1rem", color: accuracyColor,
                        border: `2px solid ${accuracyColor}50`,
                        flexShrink: 0,
                    }}>
                        {student.userName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name & Email */}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{student.userName}</span>
                            {hasWeakSections && (
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: "3px",
                                    background: "rgba(239,68,68,0.15)", color: "#EF4444",
                                    padding: "2px 8px", borderRadius: "12px",
                                    fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                                }}>
                                    <AlertTriangle size={10} /> Needs Help
                                </span>
                            )}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {student.email}
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <QuickStat icon={<BookOpen size={13} />} value={String(student.testsAttempted)} label="Tests" />
                    <QuickStat icon={<Trophy size={13} />} value={String(student.overallScore)} label="Score" />
                    <QuickStat
                        icon={<Target size={13} />}
                        value={`${student.averageAccuracy}%`}
                        label="Accuracy"
                        color={accuracyColor}
                    />
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    padding: "1.25rem",
                    background: "rgba(0,0,0,0.15)",
                    animation: "fadeIn 0.3s ease",
                }}>
                    <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                    {/* Section-wise Performance */}
                    {student.sectionWise.length > 0 && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <h4 style={{
                                fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase",
                                letterSpacing: "0.08em", color: "var(--text-secondary)",
                                marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px"
                            }}>
                                <BarChart3 size={14} /> Section-wise Performance
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
                                {student.sectionWise.map(section => {
                                    const isWeak = student.weakSections.includes(section.section);
                                    const sColor = section.accuracy >= 70 ? '#10B981' : section.accuracy >= 50 ? '#F59E0B' : '#EF4444';
                                    return (
                                        <div key={section.section} style={{
                                            background: isWeak ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                                            border: isWeak ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: "12px", padding: "0.8rem 1rem",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <span style={{
                                                    fontSize: "0.82rem", fontWeight: 700,
                                                    textTransform: "capitalize",
                                                    display: "flex", alignItems: "center", gap: "4px",
                                                }}>
                                                    {isWeak && <TrendingDown size={12} color="#EF4444" />}
                                                    {section.section}
                                                </span>
                                                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: sColor }}>
                                                    {section.accuracy}%
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{
                                                height: "6px", background: "rgba(255,255,255,0.1)",
                                                borderRadius: "3px", overflow: "hidden"
                                            }}>
                                                <div style={{
                                                    height: "100%", width: `${section.accuracy}%`,
                                                    background: sColor, borderRadius: "3px",
                                                    transition: "width 0.5s ease",
                                                }} />
                                            </div>
                                            <p style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: "0.3rem", margin: "0.3rem 0 0" }}>
                                                {section.correctCount}/{section.totalQuestions} correct
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Weak Sections Alert */}
                    {student.weakSections.length > 0 && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: "12px",
                            padding: "0.8rem 1rem",
                            marginBottom: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                        }}>
                            <AlertTriangle size={18} color="#EF4444" />
                            <div>
                                <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#EF4444", margin: 0 }}>
                                    Weak Sections Identified
                                </p>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
                                    {student.weakSections.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} — needs focused mentorship
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Test Details Table */}
                    <div>
                        <h4 style={{
                            fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: "0.08em", color: "var(--text-secondary)",
                            marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px"
                        }}>
                            <Award size={14} /> Test-wise Performance
                        </h4>

                        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                                        <th style={thStyle}>Test</th>
                                        <th style={thStyle}>Score</th>
                                        <th style={thStyle}>Rank</th>
                                        <th style={thStyle}>Accuracy</th>
                                        <th style={{ ...thStyle, textAlign: "center" }}>✓ / ✗ / —</th>
                                        <th style={thStyle}>Time</th>
                                        <th style={thStyle}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.testPerformances.map((test, idx) => {
                                        const aColor = test.accuracy >= 70 ? '#10B981' : test.accuracy >= 40 ? '#F59E0B' : '#EF4444';
                                        return (
                                            <tr key={`${test.testId}-${idx}`} style={{
                                                borderTop: "1px solid rgba(255,255,255,0.05)",
                                                transition: "background 0.2s",
                                            }}>
                                                <td style={{ ...tdStyle, fontWeight: 600, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {test.testTitle}
                                                    <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                                                        {test.subject}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontWeight: 700 }}>{test.score}</span>
                                                    <span style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>/{test.maxScore}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{
                                                        display: "inline-flex", alignItems: "center", gap: "3px",
                                                        background: test.rank <= 3 ? "rgba(255,208,47,0.15)" : "rgba(255,255,255,0.05)",
                                                        padding: "3px 8px", borderRadius: "8px",
                                                        fontWeight: 700, fontSize: "0.78rem",
                                                        color: test.rank <= 3 ? "var(--primary)" : "inherit",
                                                    }}>
                                                        {test.rank <= 3 && <Trophy size={11} />}
                                                        #{test.rank}
                                                        <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.68rem" }}>
                                                            /{test.totalAttemptees}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ color: aColor, fontWeight: 700 }}>{test.accuracy}%</span>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: "center" }}>
                                                    <span style={{ color: "#10B981", fontWeight: 600 }}>{test.correctCount}</span>
                                                    {" / "}
                                                    <span style={{ color: "#EF4444", fontWeight: 600 }}>{test.incorrectCount}</span>
                                                    {" / "}
                                                    <span style={{ color: "var(--text-secondary)" }}>{test.unattempted}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                        <Clock size={11} /> {formatTime(test.timeTaken)}
                                                    </span>
                                                </td>
                                                <td style={{ ...tdStyle, color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                                                    {formatDate(test.completedAt)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <Card style={{
            padding: "1rem 1.25rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
            transition: "transform 0.2s, box-shadow 0.2s",
        }}>
            <div style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: `${color}20`, color: color,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
            }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {label}
                </div>
            </div>
        </Card>
    );
}

function QuickStat({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color?: string }) {
    return (
        <div style={{ textAlign: "center", minWidth: "50px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", color: color || "inherit", fontWeight: 700, fontSize: "0.9rem" }}>
                {icon} {value}
            </div>
            <div style={{ fontSize: "0.62rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    textAlign: "left",
    fontSize: "0.68rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    whiteSpace: "nowrap",
};
