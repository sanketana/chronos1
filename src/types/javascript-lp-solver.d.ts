declare module 'javascript-lp-solver' {
    export interface OptimizationModel {
        optimize: string;
        opType: string;
        constraints: Record<string, { max?: number; min?: number; equal?: number }>;
        variables: Record<string, Record<string, number>>;
        ints?: Record<string, number>;
    }

    export interface SolverSolution {
        [key: string]: number;
    }

    export interface SolverInstance {
        Solve(model: OptimizationModel): SolverSolution;
    }

    const solver: SolverInstance;
    export default solver;
} 