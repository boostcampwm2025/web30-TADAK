import sys
import importlib.util
import tracemalloc


def main():
    solution_path = sys.argv[1]

    spec = importlib.util.spec_from_file_location("solution", solution_path)
    module = importlib.util.module_from_spec(spec)

    try:
        spec.loader.exec_module(module)
    except Exception as e:
        sys.stderr.write(f"{type(e).__name__}: {e}\n")
        sys.exit(1)

    if not hasattr(module, 'solution') or not callable(module.solution):
        sys.stderr.write('Error: solution function missing\n')
        sys.exit(1)

    input_data = sys.stdin.read()

    try:
        tracemalloc.start()
        result = module.solution(input_data)
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        if result is not None:
            sys.stdout.write(str(result))

        sys.stdout.write(f'\n---METRIC---\n{peak}')
    except Exception as e:
        sys.stderr.write(f"{type(e).__name__}: {e}\n")
        sys.exit(1)


main()
