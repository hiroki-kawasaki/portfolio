export default function classnames (...args) {
    return args.filter(x => !!x).join(' ');
}