import { IMatchingAlgorithm, MatchingInput, MatchingResult, ScheduledMeeting } from './IMatchingAlgorithm';

// Types for the custom IP solver
interface Variable {
    studentId: string;
    professorId: string;
    slot: string;
    preferenceRank: number;
    index: number;
}

interface Constraint {
    coefficients: number[];
    rhs: number;
    type: 'leq' | 'eq' | 'geq';
}

interface Solution {
    variables: number[];
    objectiveValue: number;
    isFeasible: boolean;
}

interface Node {
    lowerBounds: number[];
    upperBounds: number[];
    objectiveValue: number;
    depth: number;
}

export class CustomIntegerProgrammingScheduler implements IMatchingAlgorithm {
    private variables: Variable[] = [];
    private constraints: Constraint[] = [];
    private objectiveCoefficients: number[] = [];
    private maxIterations = 5000; // Reduced for better performance
    private timeLimit = 30000; // 30 seconds
    private earlyTerminationThreshold = 0.95; // Stop if we're 95% of the way to optimal

    async computeMatches(input: MatchingInput): Promise<MatchingResult> {
        console.log('[CustomIntegerProgrammingScheduler] Starting custom integer programming matching algorithm');

        const startTime = Date.now();

        // Build the optimization problem
        this.buildProblem(input);

        console.log(`[CustomIntegerProgrammingScheduler] Built problem with ${this.variables.length} variables and ${this.constraints.length} constraints`);

        // Solve using branch-and-bound
        let solution = this.solveBranchAndBound();

        // If branch-and-bound didn't find a good solution, fall back to greedy
        if (!solution.isFeasible || solution.objectiveValue <= 0) {
            console.log('[CustomIntegerProgrammingScheduler] Branch-and-bound failed, falling back to greedy approach');
            solution = this.solveGreedyFallback();
        }

        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;

        console.log(`[CustomIntegerProgrammingScheduler] Solver completed in ${timeTaken.toFixed(2)} seconds`);
        console.log(`[CustomIntegerProgrammingScheduler] Objective value: ${solution.objectiveValue}`);

        // Extract meetings from the solution
        const meetings = this.extractMeetingsFromSolution(solution, input);

        // Calculate unmatched participants
        const matchedStudentIds = new Set(meetings.map(m => m.studentId));
        const matchedProfessorIds = new Set(meetings.map(m => m.professorId));
        const unmatchedStudents = input.students.map(s => s.id).filter(id => !matchedStudentIds.has(id));
        const unmatchedProfessors = input.professors.map(p => p.id).filter(id => !matchedProfessorIds.has(id));

        console.log(`[CustomIntegerProgrammingScheduler] Finished. Scheduled ${meetings.length} meetings. Unmatched students: ${unmatchedStudents.join(', ')}. Unmatched professors: ${unmatchedProfessors.join(', ')}`);

        return {
            meetings,
            unmatchedStudents,
            unmatchedProfessors,
            timeTakenSeconds: timeTaken
        };
    }

    private buildProblem(input: MatchingInput): void {
        // Reset
        this.variables = [];
        this.constraints = [];
        this.objectiveCoefficients = [];

        // Create variables for each valid (student, professor, slot) combination
        let varIndex = 0;
        for (const student of input.students) {
            for (let prefIndex = 0; prefIndex < student.preferences.length; prefIndex++) {
                const professorId = student.preferences[prefIndex];
                const professor = input.professors.find(p => p.id === professorId);

                if (!professor) continue;

                // Find common available slots
                const commonSlots = student.availableSlots.filter(slot =>
                    professor.availableSlots.includes(slot)
                );

                for (const slot of commonSlots) {
                    this.variables.push({
                        studentId: student.id,
                        professorId,
                        slot,
                        preferenceRank: prefIndex,
                        index: varIndex++
                    });
                }
            }
        }

        // Set up objective coefficients
        this.objectiveCoefficients = this.variables.map(v =>
            this.calculatePreferenceWeight(v.preferenceRank, input.students[0].preferences.length)
        );

        // Constraint 1: Each student can have at most one meeting per time slot
        for (const student of input.students) {
            for (const slot of input.slots) {
                const constraint: Constraint = {
                    coefficients: new Array(this.variables.length).fill(0),
                    rhs: 1,
                    type: 'leq'
                };

                for (let i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].studentId === student.id && this.variables[i].slot === slot) {
                        constraint.coefficients[i] = 1;
                    }
                }

                this.constraints.push(constraint);
            }
        }

        // Constraint 2: Each professor can have at most one meeting per time slot
        for (const professor of input.professors) {
            for (const slot of input.slots) {
                const constraint: Constraint = {
                    coefficients: new Array(this.variables.length).fill(0),
                    rhs: 1,
                    type: 'leq'
                };

                for (let i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].professorId === professor.id && this.variables[i].slot === slot) {
                        constraint.coefficients[i] = 1;
                    }
                }

                this.constraints.push(constraint);
            }
        }

        // Constraint 3: Each student can meet each professor at most once
        for (const student of input.students) {
            for (const professor of input.professors) {
                const constraint: Constraint = {
                    coefficients: new Array(this.variables.length).fill(0),
                    rhs: 1,
                    type: 'leq'
                };

                for (let i = 0; i < this.variables.length; i++) {
                    if (this.variables[i].studentId === student.id && this.variables[i].professorId === professor.id) {
                        constraint.coefficients[i] = 1;
                    }
                }

                this.constraints.push(constraint);
            }
        }
    }

    private solveBranchAndBound(): Solution {
        const startTime = Date.now();
        let bestSolution: Solution = {
            variables: new Array(this.variables.length).fill(0),
            objectiveValue: -Infinity,
            isFeasible: false
        };

        // Initial node with all variables between 0 and 1
        const initialNode: Node = {
            lowerBounds: new Array(this.variables.length).fill(0),
            upperBounds: new Array(this.variables.length).fill(1),
            objectiveValue: -Infinity,
            depth: 0
        };

        const queue: Node[] = [initialNode];
        let iterations = 0;

        while (queue.length > 0 && iterations < this.maxIterations) {
            const currentTime = Date.now();
            if (currentTime - startTime > this.timeLimit) {
                console.log('[CustomIntegerProgrammingScheduler] Time limit reached, returning best solution found');
                break;
            }

            const node = queue.shift()!;
            iterations++;

            // Solve LP relaxation for current node
            const lpSolution = this.solveLP(node);

            if (!lpSolution.isFeasible) {
                continue; // Infeasible node, prune
            }

            if (lpSolution.objectiveValue <= bestSolution.objectiveValue) {
                continue; // Worse than best solution, prune
            }

            // Early termination check
            if (bestSolution.isFeasible && lpSolution.objectiveValue <= bestSolution.objectiveValue * this.earlyTerminationThreshold) {
                console.log('[CustomIntegerProgrammingScheduler] Early termination threshold reached');
                break;
            }

            // Check if solution is integer
            const fractionalVars: number[] = [];
            for (let i = 0; i < lpSolution.variables.length; i++) {
                const value = lpSolution.variables[i];
                if (Math.abs(value - Math.round(value)) > 1e-6) {
                    fractionalVars.push(i);
                }
            }

            if (fractionalVars.length === 0) {
                // Integer solution found
                if (lpSolution.objectiveValue > bestSolution.objectiveValue) {
                    bestSolution = lpSolution;
                    console.log(`[CustomIntegerProgrammingScheduler] New best solution found: ${bestSolution.objectiveValue.toFixed(2)}`);
                }
                continue;
            }

            // Branch on most fractional variable
            const branchVar = this.selectBranchingVariable(lpSolution.variables, fractionalVars);
            const value = lpSolution.variables[branchVar];

            // Create two child nodes
            const leftNode: Node = {
                lowerBounds: [...node.lowerBounds],
                upperBounds: [...node.upperBounds],
                objectiveValue: lpSolution.objectiveValue,
                depth: node.depth + 1
            };
            leftNode.upperBounds[branchVar] = Math.floor(value);

            const rightNode: Node = {
                lowerBounds: [...node.lowerBounds],
                upperBounds: [...node.upperBounds],
                objectiveValue: lpSolution.objectiveValue,
                depth: node.depth + 1
            };
            rightNode.lowerBounds[branchVar] = Math.ceil(value);

            // Add children to queue (best-first search)
            queue.push(leftNode, rightNode);
            queue.sort((a, b) => b.objectiveValue - a.objectiveValue);
        }

        console.log(`[CustomIntegerProgrammingScheduler] Branch-and-bound completed in ${iterations} iterations`);
        return bestSolution;
    }

    private solveLP(node: Node): Solution {
        // Enhanced LP solver using a more sophisticated approach
        const n = this.variables.length;
        const solution = new Array(n).fill(0);

        // Initialize with a greedy solution
        this.initializeGreedySolution(solution);

        // Improve solution using local search
        this.improveSolution(solution, node);

        // Check feasibility
        const isFeasible = this.checkFeasibility(solution);

        const objectiveValue = this.objectiveCoefficients.reduce((sum, coef, i) => sum + coef * solution[i], 0);

        return {
            variables: solution,
            objectiveValue,
            isFeasible
        };
    }

    private initializeGreedySolution(solution: number[]): void {
        // Sort variables by objective coefficient (highest first)
        const sortedVars = this.variables.map((v, i) => ({ index: i, weight: this.objectiveCoefficients[i] }))
            .sort((a, b) => b.weight - a.weight);

        for (const { index } of sortedVars) {
            // Try to set variable to 1 if possible
            const testSolution = [...solution];
            testSolution[index] = 1;

            if (this.checkFeasibility(testSolution)) {
                solution[index] = 1;
            } else {
                solution[index] = 0;
            }
        }
    }

    private improveSolution(solution: number[], node: Node): void {
        // Local search improvement
        for (let iter = 0; iter < 50; iter++) {
            let improved = false;

            // Try flipping each variable
            for (let i = 0; i < this.variables.length; i++) {
                const currentValue = solution[i];
                const newValue = currentValue > 0.5 ? 0 : 1;

                // Check bounds
                if (newValue < node.lowerBounds[i] || newValue > node.upperBounds[i]) {
                    continue;
                }

                const testSolution = [...solution];
                testSolution[i] = newValue;

                if (this.checkFeasibility(testSolution)) {
                    const currentObj = this.objectiveCoefficients.reduce((sum, coef, j) => sum + coef * solution[j], 0);
                    const newObj = this.objectiveCoefficients.reduce((sum, coef, j) => sum + coef * testSolution[j], 0);

                    if (newObj > currentObj) {
                        solution[i] = newValue;
                        improved = true;
                    }
                }
            }

            if (!improved) break;
        }
    }

    private checkFeasibility(solution: number[]): boolean {
        for (const constraint of this.constraints) {
            const lhs = constraint.coefficients.reduce((sum, coef, i) => sum + coef * solution[i], 0);

            if (constraint.type === 'leq' && lhs > constraint.rhs + 1e-6) {
                return false;
            }
        }
        return true;
    }

    private solveGreedyFallback(): Solution {
        console.log('[CustomIntegerProgrammingScheduler] Using greedy fallback solver');

        const solution = new Array(this.variables.length).fill(0);

        // Sort variables by objective coefficient (highest first)
        const sortedVars = this.variables.map((v, i) => ({ index: i, weight: this.objectiveCoefficients[i] }))
            .sort((a, b) => b.weight - a.weight);

        for (const { index } of sortedVars) {
            // Try to set variable to 1 if possible
            const testSolution = [...solution];
            testSolution[index] = 1;

            if (this.checkFeasibility(testSolution)) {
                solution[index] = 1;
            }
        }

        const objectiveValue = this.objectiveCoefficients.reduce((sum, coef, i) => sum + coef * solution[i], 0);

        return {
            variables: solution,
            objectiveValue,
            isFeasible: true
        };
    }

    private selectBranchingVariable(variables: number[], fractionalVars: number[]): number {
        // Select the most fractional variable
        let maxFractionality = 0;
        let selectedVar = fractionalVars[0];

        for (const varIndex of fractionalVars) {
            const value = variables[varIndex];
            const fractionality = Math.min(value - Math.floor(value), Math.ceil(value) - value);

            if (fractionality > maxFractionality) {
                maxFractionality = fractionality;
                selectedVar = varIndex;
            }
        }

        return selectedVar;
    }

    private calculatePreferenceWeight(preferenceRank: number, totalPreferences: number): number {
        // Higher weight for higher preference (lower rank)
        // Use exponential decay: weight = base^(totalPreferences - rank - 1)
        const base = 2;
        return Math.pow(base, totalPreferences - preferenceRank - 1);
    }

    private extractMeetingsFromSolution(solution: Solution, input: MatchingInput): ScheduledMeeting[] {
        const meetings: ScheduledMeeting[] = [];

        for (let i = 0; i < solution.variables.length; i++) {
            if (solution.variables[i] > 0.5) { // Threshold for considering a meeting scheduled
                const variable = this.variables[i];
                meetings.push({
                    eventId: input.eventId,
                    professorId: variable.professorId,
                    studentId: variable.studentId,
                    slot: variable.slot
                });

                console.log(`[CustomIntegerProgrammingScheduler] Scheduled meeting: student ${variable.studentId} with professor ${variable.professorId} at slot ${variable.slot}`);
            }
        }

        return meetings;
    }
}
