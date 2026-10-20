# Replicates encode-v2.swift's timeline so each capture mark can be reported at
# its position in the finished MP4: clamp long gaps, floor short ones, then shift
# everything after each held frame.
import json, sys
d, hold, tail = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
holds = sorted(int(x) for x in sys.argv[4:])
m = json.load(open(d + '/manifest.json'))
ts = [f['t'] for f in m['frames']]
CLAMP, MIND = 0.25, 1.0/120.0
acc = [ts[0]]
for i in range(1, len(ts)):
    acc.append(acc[i-1] + max(MIND, min(ts[i]-ts[i-1], CLAMP)))
for idx in holds:
    if idx + 1 < len(acc):
        for j in range(idx+1, len(acc)):
            acc[j] += hold
t0 = acc[0]
acc = [x - t0 for x in acc]
print('  frames %d   encoded duration %.3fs (last frame at %.3fs + %.2fs tail)' % (len(acc), acc[-1]+max(tail,0.05), acc[-1], max(tail,0.05)))
print('  %-20s %-8s %-10s %s' % ('mark', 'frame', 'capture', 'in the clip'))
for k, v in m['marks'].items():
    f = min(v['frame'], len(acc)-1)
    print('  %-20s %-8d %-10.3f %.3f' % (k, v['frame'], v['t'], acc[f]))
for idx in holds:
    if idx + 1 < len(acc):
        print('  hold on frame %d: %.3fs to %.3fs  (%.3fs)' % (idx, acc[idx], acc[idx+1], acc[idx+1]-acc[idx]))
